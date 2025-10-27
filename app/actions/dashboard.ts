'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  // Get all bottles for the user using Supabase Data API
  const { data: bottles, error } = await supabase
    .from('bottles')
    .select(`
      *,
      wine:wines(*)
    `)
    .eq('userId', user.id)
    .eq('status', 'in_cellar');

  if (error) {
    console.error('Error fetching bottles:', error);
    throw new Error('Failed to fetch bottles');
  }

  const bottlesArray = bottles || [];

  // Calculate total bottles (sum of quantities)
  const totalBottles = bottlesArray.reduce((sum, bottle) => sum + bottle.quantity, 0);

  // Calculate total value
  const totalValue = bottlesArray.reduce((sum, bottle) => {
    if (bottle.purchasePrice) {
      return sum + Number(bottle.purchasePrice) * bottle.quantity;
    }
    return sum;
  }, 0);

  // Get recent additions (last 6 bottles added) using Supabase Data API
  const { data: recentBottles, error: recentError } = await supabase
    .from('bottles')
    .select(`
      *,
      wine:wines(*)
    `)
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })
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

  // Supabase returns data already serialized, no need for Decimal conversion
  const serializedRecentBottles = (recentBottles || []).map(bottle => ({
    ...bottle,
    purchasePrice: bottle.purchasePrice ? bottle.purchasePrice.toString() : null,
    wine: bottle.wine ? {
      ...bottle.wine,
      alcoholPercentage: bottle.wine.alcoholPercentage ? bottle.wine.alcoholPercentage.toString() : null,
    } : null,
  }));

  return {
    totalBottles,
    totalValue,
    currency: bottlesArray.find((b) => b.currency)?.currency || 'USD',
    recentBottles: serializedRecentBottles,
    byType,
    byRegion,
  };
}
