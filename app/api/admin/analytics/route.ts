import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

// API routes are dynamic - cannot be statically exported
export const dynamic = "force-dynamic";



export async function GET() {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = await createClient();

    // 1. Overview Statistics
    const [usersResult, winesResult, bottlesResult, statusResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('wines').select('id', { count: 'exact', head: true }),
      supabase.from('bottles').select('quantity, purchase_price'),
      supabase.from('wines').select('status'),
    ]);

    const totalUsers = usersResult.count || 0;
    const totalWines = winesResult.count || 0;
    const totalBottles = bottlesResult.data?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;
    const totalCellarValue = bottlesResult.data?.reduce(
      (sum, b) => sum + ((b.purchase_price || 0) * (b.quantity || 0)),
      0
    ) || 0;

    const winesByStatus = {
      draft: statusResult.data?.filter(w => w.status === 'draft').length || 0,
      active: statusResult.data?.filter(w => w.status === 'active').length || 0,
    };

    // 2. User-Wine Matrix
    const { data: userWineData } = await supabase.rpc('get_user_wine_matrix');

    // Group by user
    const userWineMap = new Map<string, any>();

    if (userWineData) {
      for (const row of userWineData) {
        const userId = row.user_id;

        if (!userWineMap.has(userId)) {
          userWineMap.set(userId, {
            userId: row.user_id,
            userName: row.user_name,
            userEmail: row.user_email,
            totalBottles: 0,
            totalValue: 0,
            wines: [],
          });
        }

        const userEntry = userWineMap.get(userId);

        if (row.wine_id) {
          const quantity = parseInt(row.quantity) || 0;
          const totalPrice = parseFloat(row.total_price) || 0;

          userEntry.totalBottles += quantity;
          userEntry.totalValue += totalPrice;
          userEntry.wines.push({
            wineId: row.wine_id,
            wineName: row.wine_name,
            quantity,
            totalPrice,
          });
        }
      }
    }

    const userWineMatrix = Array.from(userWineMap.values());

    // 3. Popular Wines
    const { data: popularWinesData } = await supabase.rpc('get_popular_wines');

    const popularWines = (popularWinesData || []).map((wine: any) => ({
      wineId: wine.wine_id,
      wineName: wine.wine_name,
      producer: wine.producer,
      vintage: wine.vintage,
      userCount: parseInt(wine.user_count) || 0,
      totalBottles: parseInt(wine.total_bottles) || 0,
    }));

    // 4. Data Quality Metrics
    const { data: labelScansData } = await supabase
      .from('label_scans')
      .select('wine_id');

    const totalScans = labelScansData?.length || 0;
    const successfulScans = labelScansData?.filter(scan => scan.wine_id !== null).length || 0;
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;

    const { data: enrichmentData } = await supabase
      .from('wines')
      .select('ai_generated_summary, enrichment_version');

    const winesWithEnrichment = enrichmentData?.filter(w => w.ai_generated_summary).length || 0;
    const winesWithoutEnrichment = (enrichmentData?.length || 0) - winesWithEnrichment;
    const coveragePercent = totalWines > 0 ? (winesWithEnrichment / totalWines) * 100 : 0;

    // Find latest enrichment version
    const versions = enrichmentData
      ?.map(w => w.enrichment_version)
      .filter(Boolean)
      .sort()
      .reverse() || [];
    const latestVersion = versions[0] || 'N/A';

    return NextResponse.json({
      overview: {
        totalUsers,
        totalWines,
        totalBottles,
        totalCellarValue,
        winesByStatus,
      },
      userWineMatrix,
      popularWines,
      dataQuality: {
        labelScans: {
          total: totalScans,
          successful: successfulScans,
          successRate: Math.round(successRate * 10) / 10,
        },
        enrichment: {
          winesWithEnrichment,
          winesWithoutEnrichment,
          coveragePercent: Math.round(coveragePercent * 10) / 10,
          latestVersion,
        },
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
