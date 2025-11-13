import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createClient();

    const body = await request.json();
    const { wineId, context } = body;

    if (!wineId) {
      return NextResponse.json({ error: 'wineId is required' }, { status: 400 });
    }

    // Fetch wine
    const { data: wine, error: fetchError } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wineId)
      .single();

    if (fetchError || !wine) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    console.log(`Generating comprehensive review for wine: ${wine.name} by ${wine.producer_name}`);

    // Run comprehensive review (suggests improvements to ALL fields)
    const reviewResult = await wineEnrichmentAgent.executeComprehensiveReview({
      name: wine.name,
      producerName: wine.producer_name,
      wineType: wine.wine_type,
      vintage: wine.vintage,
      country: wine.country,
      region: wine.region,
      subRegion: wine.sub_region,
      primaryGrape: wine.primary_grape,
      tastingProfileHints: context || null,
    });

    if (!reviewResult.success || !reviewResult.data) {
      console.error('Comprehensive review failed:', reviewResult.error);
      return NextResponse.json({ error: 'AI review failed' }, { status: 500 });
    }

    console.log('Comprehensive review generated successfully');

    // Return suggestions WITHOUT saving to database
    // Frontend will apply selected changes via PATCH /api/admin/wines/[id]
    return NextResponse.json({
      success: true,
      suggestions: reviewResult.data,
      metadata: reviewResult.metadata,
    });
  } catch (error: any) {
    console.error('Enrich wine error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI review' },
      { status: 500 }
    );
  }
}
