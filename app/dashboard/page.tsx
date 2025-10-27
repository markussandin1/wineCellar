import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Wine, Plus, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/app/actions/dashboard';

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          href="/cellar/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Bottle
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wine className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">Total Bottles</h3>
          </div>
          <p className="text-3xl font-bold">{stats.totalBottles}</p>
          <p className="text-sm text-muted-foreground mt-1">In your cellar</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">Total Value</h3>
          </div>
          <p className="text-3xl font-bold">
            {stats.currency} {stats.totalValue.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Collection value</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wine className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground">Wine Types</h3>
          </div>
          <p className="text-3xl font-bold">{Object.keys(stats.byType).length}</p>
          <p className="text-sm text-muted-foreground mt-1">Different types</p>
        </div>
      </div>

      {/* Insights */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Wine Types</h2>
          {topTypes.length > 0 ? (
            <div className="space-y-3">
              {topTypes.map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize">{type}</span>
                  <span className="font-semibold">{count as number} bottles</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data yet</p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Top Regions</h2>
          {topRegions.length > 0 ? (
            <div className="space-y-3">
              {topRegions.map(([region, count]) => (
                <div key={region} className="flex justify-between items-center">
                  <span>{region}</span>
                  <span className="font-semibold">{count as number} bottles</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data yet</p>
          )}
        </div>
      </div>

      {/* Recent Additions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Additions</h2>
          <Link href="/cellar" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>

        {stats.recentBottles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentBottles.map((bottle) => (
              <Link
                key={bottle.id}
                href={`/bottle/${bottle.id}`}
                className="block rounded-lg border bg-card p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Wine className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {bottle.wine?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {bottle.wine?.producerName}
                      {bottle.wine?.vintage && ` • ${bottle.wine.vintage}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(bottle.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No bottles yet. Add your first bottle to get started!
            </p>
            <Link
              href="/cellar/add"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Your First Bottle
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
