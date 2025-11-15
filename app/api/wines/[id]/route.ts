/**
 * Wine Details API Route
 *
 * GET /api/wines/[id] - Get wine details and user's bottles of this wine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeBottleRecord } from '@/lib/utils/supabase-normalize';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wines/[id] - Get wine details with user's bottles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: wineId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    // Get wine details
    const { data: wine, error: wineError } = await supabase
      .from('wines')
      .select('*')
      .eq('id', wineId)
      .single();

    if (wineError || !wine) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    // Get user's bottles of this wine
    const { data: bottles, error: bottlesError } = await supabase
      .from('bottles')
      .select('*')
      .eq('user_id', user.id)
      .eq('wine_id', wineId)
      .order('purchase_date', { ascending: false });

    if (bottlesError) {
      console.error('Error fetching bottles:', bottlesError);
      return NextResponse.json({ error: 'Failed to fetch bottles' }, { status: 500 });
    }

    // Normalize wine data
    const normalizedWine = {
      id: wine.id,
      name: wine.name,
      fullName: wine.full_name,
      producerName: wine.producer_name,
      vintage: wine.vintage,
      wineType: wine.wine_type,
      country: wine.country,
      region: wine.region,
      subRegion: wine.sub_region,
      appellation: wine.appellation,
      primaryGrape: wine.primary_grape,
      alcoholPercentage: wine.alcohol_percentage ? String(wine.alcohol_percentage) : null,
      sweetnessLevel: wine.sweetness_level,
      body: wine.body,
      primaryLabelImageUrl: wine.primary_label_image_url,
      description: wine.description,
      aiGeneratedSummary: wine.ai_generated_summary,
      enrichmentData: wine.enrichment_data,
      enrichmentGeneratedAt: wine.enrichment_generated_at,
      enrichmentVersion: wine.enrichment_version,
      status: wine.status,
      verified: wine.verified,
      createdAt: wine.created_at,
      updatedAt: wine.updated_at,
    };

    // Normalize bottles
    const normalizedBottles = (bottles || []).map(normalizeBottleRecord);

    // Calculate total bottles
    const totalBottles = normalizedBottles.reduce((sum, bottle) => sum + bottle.quantity, 0);

    return NextResponse.json({
      wine: normalizedWine,
      bottles: normalizedBottles,
      totalBottles,
    });
  } catch (error) {
    console.error('Error in GET /api/wines/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wine details' },
      { status: 500 }
    );
  }
}
