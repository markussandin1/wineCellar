import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BottleList } from '@/components/bottles/bottle-list';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { serverGetBottles } from '@/lib/api/server';
import { PageHeader } from '@/lib/design-system';

export default async function CellarPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string; status?: string; search?: string }>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;

  const bottles = await serverGetBottles({
    wineType: params.type,
    region: params.region,
    status: params.status,
    search: params.search,
  });

  const hasActiveFilters = Boolean(
    (params.type && params.type !== 'all') ||
      (params.status && params.status !== 'all') ||
      (params.region && params.region.trim().length > 0) ||
      (params.search && params.search.trim().length > 0)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1410] to-[#0A0A0A]">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="My Cellar"
          subtitle={`${bottles.length} bottle${bottles.length !== 1 ? 's' : ''} in your collection`}
          action={
            <Link
              href="/cellar/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Bottle
            </Link>
          }
        />

        {bottles.length === 0 ? (
          <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] p-12 text-center">
            <p className="text-gray-300 mb-4">
              {hasActiveFilters
                ? 'No bottles match your current filters.'
                : 'Your cellar is empty. Add your first bottle to get started!'}
            </p>
            {!hasActiveFilters && (
              <Link
                href="/cellar/add"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                Add Your First Bottle
              </Link>
            )}
          </div>
        ) : (
          <BottleList bottles={bottles} />
        )}
      </div>
    </div>
  );
}
