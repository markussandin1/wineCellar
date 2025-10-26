import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getBottles } from '@/app/actions/bottle';
import { BottleList } from '@/components/bottles/bottle-list';
import { Plus } from 'lucide-react';

export default async function CellarPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string; status?: string; search?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const params = await searchParams;

  const bottles = await getBottles({
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Cellar</h1>
        <Link
          href="/cellar/add"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Bottle
        </Link>
      </div>

      {bottles.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'No bottles match your current filters.'
              : 'Your cellar is empty. Add your first bottle to get started!'}
          </p>
          {!hasActiveFilters && (
            <Link
              href="/cellar/add"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
  );
}
