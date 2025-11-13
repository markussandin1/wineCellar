/**
 * Dashboard Stats API Route
 *
 * GET /api/dashboard/stats - Get dashboard statistics for current user
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeBottleRecord } from '@/lib/utils/supabase-normalize';
import { ensureUserRecord } from '@/lib/utils/supabase-users';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/stats - Get dashboard statistics
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserRecord(supabase, user);

    // Get all bottles for the user
    const { data: bottles, error } = await supabase
      .from('bottles')
      .select(
        `
      *,
      wine:wines(*)
    `
      )
      .eq('user_id', user.id)
      .eq('status', 'in_cellar');

    if (error) {
      console.error('Error fetching bottles:', error);
      throw new Error('Failed to fetch bottles');
    }

    const bottlesArray = (bottles || []).map(normalizeBottleRecord);

    // Calculate total bottles (sum of quantities)
    const totalBottles = bottlesArray.reduce((sum, bottle) => sum + bottle.quantity, 0);

    // Calculate total value
    const totalValue = bottlesArray.reduce((sum, bottle) => {
      if (bottle.purchasePrice) {
        return sum + Number(bottle.purchasePrice) * bottle.quantity;
      }
      return sum;
    }, 0);

    // Get recent additions (last 6 bottles added)
    const { data: recentBottles, error: recentError } = await supabase
      .from('bottles')
      .select(
        `
      *,
      wine:wines(*)
    `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    if (recentError) {
      console.error('Error fetching recent bottles:', recentError);
      throw new Error('Failed to fetch recent bottles');
    }

    // Group by wine type
    const byType = bottlesArray.reduce((acc, bottle) => {
      const type = bottle.wine?.wineType || 'unknown';
      acc[type] = (acc[type] || 0) + bottle.quantity;
      return acc;
    }, {} as Record<string, number>);

    // Group by region
    const byRegion = bottlesArray.reduce((acc, bottle) => {
      const region = bottle.wine?.region || 'Unknown';
      acc[region] = (acc[region] || 0) + bottle.quantity;
      return acc;
    }, {} as Record<string, number>);

    const serializedRecentBottles = (recentBottles || []).map((bottle) =>
      normalizeBottleRecord(bottle)
    );

    return NextResponse.json({
      totalBottles,
      totalValue,
      currency: bottlesArray.find((b) => b.currency)?.currency || 'USD',
      recentBottles: serializedRecentBottles,
      byType,
      byRegion,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard/stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
