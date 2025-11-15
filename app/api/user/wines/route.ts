/**
 * User Wines API Route
 *
 * GET /api/user/wines - Get wines that the user owns (has bottles of)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/wines - Search user's wines
 * Query params:
 * - search: Optional search term for wine name or producer
 * - limit: Optional limit (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get all wine IDs that the user has bottles of
    const { data: bottles, error: bottlesError } = await supabase
      .from('bottles')
      .select('wine_id')
      .eq('user_id', user.id);

    if (bottlesError) {
      console.error('Error fetching user bottles:', bottlesError);
      return NextResponse.json({ error: 'Failed to fetch user wines' }, { status: 500 });
    }

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({ wines: [] });
    }

    // Get unique wine IDs
    const wineIds = [...new Set(bottles.map(b => b.wine_id))];

    // Build wine query
    let wineQuery = supabase
      .from('wines')
      .select('id, name, full_name, producer_name, vintage, wine_type, country, region, sub_region, primary_grape, primary_label_image_url')
      .in('id', wineIds);

    // Apply search filter if provided
    if (searchTerm.trim()) {
      const escapeLike = (value: string) =>
        value.replace(/[%_]/g, (match) => `\\${match}`);

      const likePattern = `%${escapeLike(searchTerm)}%`;

      wineQuery = wineQuery.or(`name.ilike.${likePattern},producer_name.ilike.${likePattern},full_name.ilike.${likePattern},primary_grape.ilike.${likePattern}`);
    }

    // Order by name and limit results
    wineQuery = wineQuery.order('name', { ascending: true }).limit(limit);

    const { data: wines, error: winesError } = await wineQuery;

    if (winesError) {
      console.error('Error fetching wines:', winesError);
      return NextResponse.json({ error: 'Failed to fetch wines' }, { status: 500 });
    }

    // For each wine, get the bottle count
    const winesWithCounts = await Promise.all(
      (wines || []).map(async (wine) => {
        const { data: wineBottles, error: countError } = await supabase
          .from('bottles')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('wine_id', wine.id);

        if (countError) {
          console.error('Error counting bottles for wine:', countError);
          return { ...wine, bottleCount: 0 };
        }

        const totalBottles = (wineBottles || []).reduce((sum, b) => sum + b.quantity, 0);

        return {
          id: wine.id,
          name: wine.name,
          fullName: wine.full_name,
          producerName: wine.producer_name,
          vintage: wine.vintage,
          wineType: wine.wine_type,
          country: wine.country,
          region: wine.region,
          subRegion: wine.sub_region,
          primaryGrape: wine.primary_grape,
          primaryLabelImageUrl: wine.primary_label_image_url,
          bottleCount: totalBottles,
        };
      })
    );

    return NextResponse.json({ wines: winesWithCounts });
  } catch (error) {
    console.error('Error in GET /api/user/wines:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user wines' },
      { status: 500 }
    );
  }
}
