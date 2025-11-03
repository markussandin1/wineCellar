import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadLabelImage } from '@/lib/supabase';
import { labelScanAgent } from '@/lib/ai/agents/label-scan';

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

    // Step 2: Search for existing wine in database
    console.log('Searching for existing wine in database...');
    const { data: existingWines, error: searchError } = await supabase
      .from('wines')
      .select('*')
      .ilike('producer_name', `%${extracted.producerName}%`)
      .limit(10);

    if (searchError) {
      console.error('Error searching for wines:', searchError);
      // Continue without existing wines instead of failing
    }

    // Find best match using similarity scoring
    let bestMatch = null;
    let bestScore = 0;

    console.log(`Comparing extracted data against ${existingWines?.length || 0} candidates:`);
    console.log(`  Extracted: "${extracted.wineName}" by "${extracted.producerName}" (${extracted.vintage || 'NV'})`);

    for (const wine of (existingWines || [])) {
      const nameScore = similarity(wine.name, extracted.wineName);
      const producerScore = similarity(wine.producer_name, extracted.producerName);
      const vintageMatch = !extracted.vintage || wine.vintage === extracted.vintage;

      const totalScore = (nameScore + producerScore) / 2;

      console.log(`  Candidate: "${wine.name}" by "${wine.producer_name}" (${wine.vintage || 'NV'})`);
      console.log(`    Name: ${(nameScore * 100).toFixed(1)}%, Producer: ${(producerScore * 100).toFixed(1)}%, Total: ${(totalScore * 100).toFixed(1)}%, Vintage match: ${vintageMatch}`);

      // If we have a good match (>80% similarity) and vintage matches
      if (totalScore > 0.80 && vintageMatch && totalScore > bestScore) {
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
        imageUrl, // User's scanned image (saved to their bottle)
        wineImageUrl: bestMatch.primary_label_image_url, // Wine's official image from database
        // Include enrichment data if available
        enrichmentData: bestMatch.enrichment_data,
        // Legacy fields for backward compatibility
        description: bestMatch.description,
        tastingNotes: bestMatch.tasting_notes,
        aiGeneratedSummary: bestMatch.ai_generated_summary,
      });
    }

    console.log('✗ No existing wine found matching criteria (>80% similarity + vintage match)');

    // No match found - return extracted data
    // Frontend will decide whether to create wine with enrichment
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
    });
  } catch (error: any) {
    console.error('Label scanning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan label' },
      { status: 500 }
    );
  }
}
