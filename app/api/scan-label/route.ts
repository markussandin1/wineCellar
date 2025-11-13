import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadLabelImage } from '@/lib/supabase';
import { labelScanAgent } from '@/lib/ai/agents/label-scan';
import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


// Helper function to normalize text for comparison
function normalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .trim();
}

// Helper function to calculate string similarity (simple Levenshtein distance)
function similarity(s1: string, s2: string): number {
  // Normalize both strings before comparison
  const norm1 = normalize(s1);
  const norm2 = normalize(s2);

  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64 for OpenAI
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Upload image to Supabase Storage
    let imageUrl: string | null = null;
    try {
      imageUrl = await uploadLabelImage(buffer, user.id, image.name);
      console.log('Image uploaded to:', imageUrl);
    } catch (uploadError) {
      console.error('Failed to upload image:', uploadError);
      // Continue even if upload fails - we can still extract data
    }

    // Step 1: Extract basic information using Label Scan Agent V2
    console.log('Extracting basic wine information from label...');
    const mimeType = image.type || 'image/jpeg';
    const scanResult = await labelScanAgent.execute({
      imageBase64: base64Image,
      mimeType,
    });

    if (!scanResult.success || !scanResult.data) {
      throw new Error(scanResult.error || 'Failed to extract data from label');
    }

    const extracted = scanResult.data;

    // Log extracted data for debugging
    console.log('Extracted wine data:', {
      wineName: extracted.wineName,
      producerName: extracted.producerName,
      vintage: extracted.vintage,
      wineType: extracted.wineType,
      country: extracted.country,
      region: extracted.region,
      confidence: extracted.confidence,
    });

    // Validate minimum required data (wine name is essential)
    if (!extracted.wineName) {
      throw new Error(
        'Label scan failed to extract wine name. Please ensure the label is clearly visible and try again.'
      );
    }

    // If producer name is missing, use wine name as fallback
    if (!extracted.producerName) {
      console.warn('Producer name not extracted, using wine name as fallback');
      extracted.producerName = extracted.wineName;
    }

    // Step 2: Search for existing wine in database
    console.log('Searching for existing wine in database...');

    // Search by both wine name AND producer name to increase chances of finding matches
    const { data: winesByName } = await supabase
      .from('wines')
      .select('*')
      .ilike('name', `%${extracted.wineName}%`)
      .limit(10);

    const { data: winesByProducer } = await supabase
      .from('wines')
      .select('*')
      .ilike('producer_name', `%${extracted.producerName}%`)
      .limit(10);

    // Combine and deduplicate candidates
    const candidatesMap = new Map();
    [...(winesByName || []), ...(winesByProducer || [])].forEach(wine => {
      candidatesMap.set(wine.id, wine);
    });
    const existingWines = Array.from(candidatesMap.values());

    // Generic wine names that need strict producer matching
    const GENERIC_WINE_NAMES = [
      'pinot noir', 'chardonnay', 'cabernet sauvignon', 'merlot', 'syrah', 'shiraz',
      'sauvignon blanc', 'riesling', 'malbec', 'tempranillo', 'sangiovese',
      'zinfandel', 'grenache', 'petit verdot', 'viognier', 'gewürztraminer'
    ];

    // Find best match using similarity scoring
    let bestMatch = null;
    let bestScore = 0;

    console.log(`Comparing extracted data against ${existingWines?.length || 0} candidates:`);
    console.log(`  Extracted: "${extracted.wineName}" by "${extracted.producerName}" (${extracted.vintage || 'NV'})`);

    // Check if wine name is generic (just the grape variety)
    const isGenericName = GENERIC_WINE_NAMES.includes(normalize(extracted.wineName));

    for (const wine of (existingWines || [])) {
      const nameScore = similarity(wine.name, extracted.wineName);
      const producerScore = similarity(wine.producer_name, extracted.producerName);
      const vintageMatch = !extracted.vintage || wine.vintage === extracted.vintage;

      // VETO RULE: If wine name is generic AND producer match is poor, skip this candidate
      // This prevents "Pinot Noir" from matching any other "Pinot Noir" with different producer
      if (isGenericName && producerScore < 0.40) {
        console.log(`  Candidate: "${wine.name}" by "${wine.producer_name}" (${wine.vintage || 'NV'})`);
        console.log(`    REJECTED: Generic wine name "${extracted.wineName}" requires producer match >40% (got ${(producerScore * 100).toFixed(1)}%)`);
        continue;
      }

      // Dynamic weighting based on whether name is generic
      // Generic names: Producer is MORE important (40% name, 60% producer)
      // Unique names: Name is more important (70% name, 30% producer)
      const nameWeight = isGenericName ? 0.40 : 0.70;
      const producerWeight = isGenericName ? 0.60 : 0.30;
      let totalScore = (nameScore * nameWeight) + (producerScore * producerWeight);

      // Bonus: Prefer wines with more complete data (has vintage, country, region, etc.)
      const hasVintage = wine.vintage !== null;
      const hasCountry = wine.country !== null && wine.country !== '';
      const hasRegion = wine.region !== null && wine.region !== '';
      const hasEnrichment = wine.enrichment_data !== null;

      // Add small bonus for data completeness (max 5% boost)
      let completenessBonus = 0;
      if (hasVintage) completenessBonus += 0.01;
      if (hasCountry) completenessBonus += 0.01;
      if (hasRegion) completenessBonus += 0.01;
      if (hasEnrichment) completenessBonus += 0.02;

      totalScore += completenessBonus;

      console.log(`  Candidate: "${wine.name}" by "${wine.producer_name}" (${wine.vintage || 'NV'})`);
      console.log(`    Name: ${(nameScore * 100).toFixed(1)}%, Producer: ${(producerScore * 100).toFixed(1)}%, Weighted: ${(totalScore * 100).toFixed(1)}% (${isGenericName ? 'generic name' : 'unique name'}), Vintage match: ${vintageMatch}`);

      // Stricter threshold: 85% for matches
      // Require vintage match to avoid false positives
      // Require minimum producer similarity (40%) for generic wine names
      const meetsThreshold = totalScore > 0.85;
      const meetsProducerRequirement = !isGenericName || producerScore >= 0.40;

      if (meetsThreshold && vintageMatch && meetsProducerRequirement && totalScore > bestScore) {
        bestMatch = wine;
        bestScore = totalScore;
      }
    }

    if (bestMatch) {
      console.log(`✓ Found existing wine: ${bestMatch.name} (${(bestScore * 100).toFixed(1)}% match)`);

      // Return existing wine data (FAST PATH - no AI enrichment needed)
      return NextResponse.json({
        wineName: bestMatch.name,
        producerName: bestMatch.producer_name,
        vintage: bestMatch.vintage,
        wineType: bestMatch.wine_type,
        country: bestMatch.country,
        region: bestMatch.region,
        subRegion: bestMatch.sub_region,
        primaryGrape: bestMatch.primary_grape,
        confidence: bestScore,
        existingWineId: bestMatch.id,
        wasCreatedNow: false, // Wine already existed
        imageUrl, // User's scanned image (saved to their bottle)
        wineImageUrl: bestMatch.primary_label_image_url, // Wine's official image from database
        // Include enrichment data if available
        enrichmentData: bestMatch.enrichment_data,
        // Legacy fields for backward compatibility
        description: bestMatch.description,
        tastingNotes: bestMatch.tasting_notes,
        aiGeneratedSummary: bestMatch.ai_generated_summary,
        // IMPORTANT: Preserve original scanned data for wine rejection flow
        // If user clicks "This is not the correct wine", we need the original scan data
        originalScannedData: {
          wineName: extracted.wineName,
          producerName: extracted.producerName,
          vintage: extracted.vintage,
          wineType: extracted.wineType,
          country: extracted.country,
          region: extracted.region,
          subRegion: extracted.subRegion,
          primaryGrape: extracted.primaryGrape,
        },
      });
    }

    console.log('✗ No existing wine found matching criteria (>85% similarity + vintage match + producer requirements)');
    console.log('Generating wine enrichment (not saved to DB yet)...');

    // Step 3: No match found - run enrichment (in memory, not saved to DB)
    const enrichmentResult = await wineEnrichmentAgent.execute({
      name: extracted.wineName,
      producerName: extracted.producerName,
      wineType: extracted.wineType,
      vintage: extracted.vintage,
      country: extracted.country,
      region: extracted.region,
      subRegion: extracted.subRegion,
      primaryGrape: extracted.primaryGrape,
    });

    let enrichmentData = null;
    if (enrichmentResult.success && enrichmentResult.data) {
      enrichmentData = enrichmentResult.data;
      console.log('Wine enrichment generated successfully');
    } else {
      console.warn('Wine enrichment failed:', enrichmentResult.error);
    }

    // Return extracted data + enrichment (NOT saved to DB yet)
    // User will review/edit enrichment before saving
    return NextResponse.json({
      wineName: extracted.wineName,
      producerName: extracted.producerName,
      vintage: extracted.vintage,
      wineType: extracted.wineType,
      country: extracted.country,
      region: extracted.region,
      subRegion: extracted.subRegion,
      primaryGrape: extracted.primaryGrape,
      confidence: extracted.confidence,
      existingWineId: null,
      imageUrl,
      enrichmentData, // Enrichment data for preview/edit (not saved to DB)
    });
  } catch (error: any) {
    console.error('Label scanning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan label' },
      { status: 500 }
    );
  }
}
