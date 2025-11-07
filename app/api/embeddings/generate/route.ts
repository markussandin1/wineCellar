import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWineEmbedding, hasValidEnrichmentForEmbedding } from '@/lib/ai/embeddings';
import type { WineEnrichmentOutput } from '@/lib/ai/agents/wine-enrichment';

/**
 * POST /api/embeddings/generate
 *
 * Generates embedding for a single wine by ID.
 * Used after wine enrichment to automatically generate embeddings.
 *
 * Request body:
 * {
 *   "wineId": "uuid-of-wine"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get wine ID from request
    const body = await request.json();
    const { wineId } = body;

    if (!wineId) {
      return NextResponse.json(
        { error: 'wineId is required' },
        { status: 400 }
      );
    }

    // Fetch wine with enrichment data
    const { data: wine, error: fetchError } = await supabase
      .from('wines')
      .select('id, name, producer_name, wine_type, primary_grape, enrichment_data')
      .eq('id', wineId)
      .single();

    if (fetchError || !wine) {
      console.error('Error fetching wine:', fetchError);
      return NextResponse.json(
        { error: 'Wine not found' },
        { status: 404 }
      );
    }

    // Validate enrichment data
    if (!hasValidEnrichmentForEmbedding(wine.enrichment_data)) {
      return NextResponse.json(
        { error: 'Wine does not have sufficient enrichment data for embedding generation' },
        { status: 400 }
      );
    }

    const enrichmentData = wine.enrichment_data as WineEnrichmentOutput;

    // Generate embedding
    console.log(`Generating embedding for ${wine.name} by ${wine.producer_name}`);
    const embeddingResult = await generateWineEmbedding({
      wineId: wine.id,
      wineName: wine.name,
      producerName: wine.producer_name,
      wineType: wine.wine_type,
      primaryGrape: wine.primary_grape,
      enrichmentData,
    });

    // Update wine with embedding
    const { error: updateError } = await supabase
      .from('wines')
      .update({ embedding: embeddingResult.embedding })
      .eq('id', wine.id);

    if (updateError) {
      console.error('Failed to update wine with embedding:', updateError);
      return NextResponse.json(
        { error: 'Failed to save embedding' },
        { status: 500 }
      );
    }

    console.log(`✓ Successfully generated embedding for ${wine.name} (${embeddingResult.tokensUsed} tokens)`);

    return NextResponse.json({
      success: true,
      wineId: wine.id,
      wineName: wine.name,
      tokensUsed: embeddingResult.tokensUsed,
      dimensions: embeddingResult.dimensions,
      model: embeddingResult.model,
    });

  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}
