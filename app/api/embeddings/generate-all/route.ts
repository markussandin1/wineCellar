import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWineEmbedding, hasValidEnrichmentForEmbedding } from '@/lib/ai/embeddings';
import type { WineEnrichmentOutput } from '@/lib/ai/agents/wine-enrichment';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


/**
 * POST /api/embeddings/generate-all
 *
 * Generates embeddings for all wines that:
 * - Have enrichment_data
 * - Don't already have an embedding
 *
 * This is a batch operation that processes wines in chunks to avoid timeouts.
 * Use query params:
 * - ?limit=N to process only N wines (default: all)
 * - ?forceRegenerate=true to regenerate embeddings even if they exist
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const forceRegenerate = searchParams.get('forceRegenerate') === 'true';

    console.log(`Starting embedding generation - limit: ${limit || 'none'}, forceRegenerate: ${forceRegenerate}`);

    // Build query to fetch wines needing embeddings
    let query = supabase
      .from('wines')
      .select('id, name, producer_name, wine_type, primary_grape, enrichment_data, embedding')
      .not('enrichment_data', 'is', null); // Must have enrichment data

    if (!forceRegenerate) {
      query = query.is('embedding', null); // Only wines without embeddings
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: wines, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching wines:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch wines' },
        { status: 500 }
      );
    }

    if (!wines || wines.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No wines to process',
        processed: 0,
        skipped: 0,
        failed: 0,
      });
    }

    console.log(`Found ${wines.length} wines to process`);

    // Process wines
    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ wineId: string; wineName: string; error: string }>,
    };

    for (const wine of wines) {
      try {
        // Validate enrichment data
        if (!hasValidEnrichmentForEmbedding(wine.enrichment_data)) {
          console.log(`Skipping wine ${wine.id} (${wine.name}): insufficient enrichment data`);
          results.skipped++;
          continue;
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
          console.error(`Failed to update embedding for wine ${wine.id}:`, updateError);
          results.failed++;
          results.errors.push({
            wineId: wine.id,
            wineName: wine.name,
            error: updateError.message,
          });
          continue;
        }

        console.log(`✓ Successfully generated embedding for ${wine.name} (${embeddingResult.tokensUsed} tokens)`);
        results.processed++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`Error processing wine ${wine.id} (${wine.name}):`, error);
        results.failed++;
        results.errors.push({
          wineId: wine.id,
          wineName: wine.name,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log('Embedding generation complete:', results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} wines successfully`,
      ...results,
    });

  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}
