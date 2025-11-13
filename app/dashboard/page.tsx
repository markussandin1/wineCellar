import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wine, Plus, TrendingUp, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/app/actions/dashboard';
import { PageHeader, StatCard } from '@/lib/design-system';
import { FoodPairingWidget } from '@/components/food-pairing/FoodPairingWidget';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const stats = await getDashboardStats();

  const topTypes = Object.entries(stats.byType)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3);

  const topRegions = Object.entries(stats.byRegion)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Welcome to your wine cellar"
          action={
            <Link
              href="/cellar/add"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Bottle</span>
              <span className="sm:hidden">Add</span>
            </Link>
          }
        />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-8 sm:mb-12">
          <StatCard
            label="Total Bottles"
            value={stats.totalBottles}
            subtitle="In your cellar"
            icon={<Wine className="h-5 w-5" />}
          />

          <StatCard
            label="Total Value"
            value={`${stats.currency} ${stats.totalValue.toFixed(0)}`}
            subtitle="Collection value"
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <StatCard
            label="Wine Types"
            value={Object.keys(stats.byType).length}
            subtitle="Different types"
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>

        {/* Food Pairing Widget - Full Width */}
        <div className="mb-8 sm:mb-12">
          <FoodPairingWidget />
        </div>

        {/* Insights */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-8 sm:mb-12">
          {/* Top Wine Types */}
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-amber-400">Top Wine Types</h2>
            {topTypes.length > 0 ? (
              <div className="space-y-3">
                {topTypes.map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-gray-100">
                    <span className="capitalize">{type}</span>
                    <span className="font-semibold text-amber-400">{count as number} bottles</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No data yet</p>
            )}
          </div>

          {/* Top Regions */}
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-amber-400">Top Regions</h2>
            {topRegions.length > 0 ? (
              <div className="space-y-3">
                {topRegions.map(([region, count]) => (
                  <div key={region} className="flex justify-between items-center text-gray-100">
                    <span>{region}</span>
                    <span className="font-semibold text-amber-400">{count as number} bottles</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No data yet</p>
            )}
          </div>
        </div>

        {/* Recent Additions */}
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-amber-400">Recent Additions</h2>
            <Link href="/cellar" className="text-sm text-amber-400 hover:text-yellow-400 transition-colors font-medium">
              View All →
            </Link>
          </div>

          {stats.recentBottles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentBottles.map((bottle: any) => (
                <Link
                  key={bottle.id}
                  href={`/bottle/${bottle.id}`}
                  className="block relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-4 hover:scale-105 transition-all cursor-pointer shadow-lg hover:shadow-amber-900/20"
                >
                  <div className="flex items-start gap-3">
                    <Wine className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-gray-100">
                        {bottle.wine?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-300 truncate">
                        {bottle.wine?.producerName}
                        {bottle.wine?.vintage && ` • ${bottle.wine.vintage}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(bottle.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-12 text-center">
              <p className="text-gray-300 mb-4">
                No bottles yet. Add your first bottle to get started!
              </p>
              <Link
                href="/cellar/add"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                Add Your First Bottle
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
