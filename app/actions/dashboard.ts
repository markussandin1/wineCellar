'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new Error('Unauthorized');
  }

  // Get all bottles for the user
  const bottles = await prisma.bottle.findMany({
    where: {
      userId: user.id,
      status: 'in_cellar',
    },
    include: {
      wine: true,
    },
  });

  // Calculate total bottles (sum of quantities)
  const totalBottles = bottles.reduce((sum, bottle) => sum + bottle.quantity, 0);

  // Calculate total value
  const totalValue = bottles.reduce((sum, bottle) => {
    if (bottle.purchasePrice) {
      return sum + Number(bottle.purchasePrice) * bottle.quantity;
    }
    return sum;
  }, 0);

  // Get recent additions (last 6 bottles added)
  const recentBottles = await prisma.bottle.findMany({
    where: {
      userId: user.id,
    },
    include: {
      wine: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 6,
  });

  // Group by wine type
  const byType = bottles.reduce((acc, bottle) => {
    const type = bottle.wine?.wineType || 'unknown';
    acc[type] = (acc[type] || 0) + bottle.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Group by region
  const byRegion = bottles.reduce((acc, bottle) => {
    const region = bottle.wine?.region || 'Unknown';
    acc[region] = (acc[region] || 0) + bottle.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Convert Decimal to string for recent bottles
  const serializedRecentBottles = recentBottles.map(bottle => ({
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
    currency: bottles.find((b) => b.currency)?.currency || 'USD',
    recentBottles: serializedRecentBottles,
    byType,
    byRegion,
  };
}
