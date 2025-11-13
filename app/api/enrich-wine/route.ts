import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';
import type { WineEnrichmentInput } from '@/lib/ai/agents/wine-enrichment';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, producerName, wineType, vintage, country, region, subRegion, primaryGrape, tastingProfileHints } = body;

    // Validate required fields
    if (!name || !producerName) {
      return NextResponse.json(
        { error: 'Wine name and producer name are required' },
        { status: 400 }
      );
    }

    // Build input for wine enrichment agent
    const input: WineEnrichmentInput = {
      name,
      producerName,
      wineType: wineType || null,
      vintage: vintage || null,
      country: country || null,
      region: region || null,
      subRegion: subRegion || null,
      primaryGrape: primaryGrape || null,
      tastingProfileHints: tastingProfileHints || null,
    };

    console.log('Enriching wine:', input);

    // Execute wine enrichment agent
    const result = await wineEnrichmentAgent.execute(input);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to enrich wine data' },
        { status: 500 }
      );
    }

    console.log('Wine enrichment successful');

    // Return enriched data
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('Wine enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich wine' },
      { status: 500 }
    );
  }
}
