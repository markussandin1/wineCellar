import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadLabelImage } from '@/lib/supabase';
import OpenAI from 'openai';
import { labelScanConfig } from '@/config/ai';

const openai = new OpenAI({
  apiKey: process.env.OpenAI_API_Key,
});

// Helper function to calculate string similarity (simple Levenshtein distance)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
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

    // Step 1: Extract basic information with OpenAI Vision
    console.log('Extracting basic wine information from label...');
    const visionResponse = await openai.chat.completions.create({
      model: labelScanConfig.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: labelScanConfig.prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: labelScanConfig.maxTokens,
    });

    const extractedText = visionResponse.choices[0]?.message?.content;
    if (!extractedText) {
      throw new Error('Failed to extract data from label');
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanedText = extractedText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7); // Remove ```json
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3); // Remove ```
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3); // Remove trailing ```
    }
    cleanedText = cleanedText.trim();

    // Parse the JSON response
    const extracted = JSON.parse(cleanedText);

    // Step 2: Search for existing wine in database using Supabase Data API
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

    for (const wine of (existingWines || [])) {
      const nameScore = similarity(wine.name, extracted.wineName);
      const producerScore = similarity(wine.producer_name, extracted.producerName);
      const vintageMatch = !extracted.vintage || wine.vintage === extracted.vintage;

      const totalScore = (nameScore + producerScore) / 2;

      // If we have a good match (>85% similarity) and vintage matches
      if (totalScore > 0.85 && vintageMatch && totalScore > bestScore) {
        bestMatch = wine;
        bestScore = totalScore;
      }
    }

    if (bestMatch) {
      console.log(`Found existing wine: ${bestMatch.name} (${bestScore * 100}% match)`);

      // Return existing wine data
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
        imageUrl, // Include uploaded image URL
        // Include additional wine data if available
        description: bestMatch.description,
        tastingNotes: bestMatch.tasting_notes,
        aiGeneratedSummary: bestMatch.ai_generated_summary,
      });
    }

    console.log('No existing wine found, returning extracted data');

    // No match found - return extracted data
    // In a future enhancement, we could call OpenAI again here for detailed info
    return NextResponse.json({
      ...extracted,
      existingWineId: null,
      imageUrl, // Include uploaded image URL
    });
  } catch (error: any) {
    console.error('Label scanning error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan label' },
      { status: 500 }
    );
  }
}
