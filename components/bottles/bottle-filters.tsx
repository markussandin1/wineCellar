'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Grid3x3, List } from 'lucide-react';
import { useState } from 'react';

const WINE_TYPES = ['all', 'red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
const STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'in_cellar', label: 'In Cellar' },
  { value: 'consumed', label: 'Consumed' },
  { value: 'watchlist', label: 'Watch List' },
];

type ViewMode = 'grid' | 'list';

export function BottleFilters({
  viewMode,
  setViewMode,
  totalCount,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const currentType = searchParams.get('type') || 'all';
  const currentStatus = searchParams.get('status') || 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/cellar?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery.trim()) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }

    router.push(`/cellar?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by wine name or producer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Wine Type Filter */}
          <div className="flex gap-1">
            {WINE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => updateFilter('type', type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  currentType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1">
            {STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => updateFilter('status', status.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  currentStatus === status.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{totalCount} bottles</span>
          <div className="flex gap-1 rounded-md border p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
