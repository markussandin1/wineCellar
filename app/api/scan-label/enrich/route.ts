import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


/**
 * POST /api/scan-label/enrich
 * Generates wine enrichment data with optional user context
 * Used when user rejects a matched wine and wants to create a new one
 * Returns enrichment data WITHOUT saving to database
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      producerName,
      wineType,
      vintage,
      country,
      region,
      subRegion,
      primaryGrape,
      tastingProfileHints,
    } = body;

    // Validate required fields
    if (!name || !producerName) {
      return NextResponse.json(
        { error: 'Wine name and producer name are required' },
        { status: 400 }
      );
    }

    console.log('[enrich] Generating wine enrichment with user context...');
    console.log('[enrich] Wine:', name, 'by', producerName);
    if (tastingProfileHints) {
      console.log('[enrich] User context:', tastingProfileHints.substring(0, 100) + '...');
    }

    // Run enrichment agent
    const enrichmentResult = await wineEnrichmentAgent.execute({
      name,
      producerName,
      wineType: wineType || null,
      vintage: vintage || null,
      country: country || null,
      region: region || null,
      subRegion: subRegion || null,
      primaryGrape: primaryGrape || null,
      tastingProfileHints: tastingProfileHints || null,
    });

    if (!enrichmentResult.success || !enrichmentResult.data) {
      throw new Error(enrichmentResult.error || 'Failed to generate wine profile');
    }

    console.log('[enrich] Enrichment generated successfully');

    // Return enrichment data (NOT saved to DB)
    return NextResponse.json({
      success: true,
      enrichmentData: enrichmentResult.data,
    });
  } catch (error: any) {
    console.error('[enrich] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate wine profile' },
      { status: 500 }
    );
  }
}
