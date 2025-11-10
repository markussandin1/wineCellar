import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { wineEnrichmentAgent } from '@/lib/ai/agents/wine-enrichment';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createClient();

    const body = await request.json();
    const { wineId } = body;

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

    console.log(`Enriching wine: ${wine.name} by ${wine.producer_name}`);

    // Run enrichment
    const enrichmentResult = await wineEnrichmentAgent.execute({
      name: wine.name,
      producerName: wine.producer_name,
      wineType: wine.wine_type,
      vintage: wine.vintage,
      country: wine.country,
      region: wine.region,
      subRegion: wine.sub_region,
      primaryGrape: wine.primary_grape,
    });

    if (!enrichmentResult.success || !enrichmentResult.data) {
      console.error('Enrichment failed:', enrichmentResult.error);
      return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 });
    }

    const enrichmentData = enrichmentResult.data;
    const aiGeneratedSummary = enrichmentData.summary;

    // Generate full_name if missing
    const fullNameParts = [wine.name];
    if (wine.producer_name && wine.producer_name !== wine.name) {
      fullNameParts.push(wine.producer_name);
    }
    if (wine.vintage) {
      fullNameParts.push(String(wine.vintage));
    }
    const fullName = fullNameParts.join(' ');

    // Update wine
    const { data: updatedWine, error: updateError } = await supabase
      .from('wines')
      .update({
        full_name: fullName,
        enrichment_data: enrichmentData,
        enrichment_generated_at: new Date().toISOString(),
        enrichment_version: '2.0.0',
        ai_generated_summary: aiGeneratedSummary,
      })
      .eq('id', wineId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating wine:', updateError);
      return NextResponse.json({ error: 'Failed to update wine' }, { status: 500 });
    }

    console.log('Wine enriched successfully:', updatedWine.id);

    return NextResponse.json({
      success: true,
      wine: {
        id: updatedWine.id,
        fullName: updatedWine.full_name,
        aiGeneratedSummary: updatedWine.ai_generated_summary,
        enrichmentData: updatedWine.enrichment_data,
      },
    });
  } catch (error: any) {
    console.error('Enrich wine error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich wine' },
      { status: 500 }
    );
  }
}
