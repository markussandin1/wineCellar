import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const search = searchParams.get('search') || '';
    const wineType = searchParams.get('wineType')?.split(',').filter(Boolean) || [];
    const country = searchParams.get('country')?.split(',').filter(Boolean) || [];
    const status = searchParams.get('status') as 'draft' | 'active' | null;
    const verified = searchParams.get('verified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = supabase
      .from('wines')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,producer_name.ilike.%${search}%,primary_grape.ilike.%${search}%`
      );
    }

    // Apply wine type filter
    if (wineType.length > 0) {
      query = query.in('wine_type', wineType);
    }

    // Apply country filter
    if (country.length > 0) {
      query = query.in('country', country);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply verified filter
    if (verified !== null) {
      query = query.eq('verified', verified === 'true');
    }

    // Apply sorting
    const validSortColumns = ['full_name', 'vintage', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: wines, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get bottle stats for each wine
    const wineIds = wines?.map(w => w.id) || [];
    const { data: bottleStats } = await supabase.rpc('get_wine_bottle_stats', {
      wine_ids: wineIds,
    });

    // Merge stats with wines
    const winesWithStats = wines?.map(wine => {
      const stats = bottleStats?.find((s: any) => s.wine_id === wine.id);
      return {
        ...wine,
        userCount: stats?.user_count || 0,
        bottleCount: stats?.bottle_count || 0,
      };
    });

    return NextResponse.json({
      wines: winesWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin wines list error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch wines' },
      { status: 500 }
    );
  }
}
