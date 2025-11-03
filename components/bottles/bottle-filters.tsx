'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Grid3x3, List } from 'lucide-react';
import { useState } from 'react';
import type { ViewMode } from './bottle-list';

const WINE_TYPES = ['all', 'red', 'white', 'rose', 'sparkling', 'dessert', 'fortified'];
const STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'in_cellar', label: 'In Cellar' },
  { value: 'consumed', label: 'Consumed' },
  { value: 'watchlist', label: 'Watch List' },
];

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by wine name or producer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-amber-900/30 bg-[#1A1410] pl-9 pr-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-amber-500 hover:to-yellow-600 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
        >
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Wine Type Filter */}
          <div className="flex gap-2">
            {WINE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => updateFilter('type', type)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentType === type
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#2A1F1A] border border-amber-900/30 text-gray-300 hover:bg-[#3A2F2A] hover:text-amber-400'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => updateFilter('status', status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  currentStatus === status.value
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-[#2A1F1A] border border-amber-900/30 text-gray-300 hover:bg-[#3A2F2A] hover:text-amber-400'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-amber-400 font-medium">{totalCount} bottles</span>
          <div className="flex gap-1 rounded-lg border border-amber-900/30 p-1 bg-[#1A1410]">
            <button
              onClick={() => {
                // Toggle between grid sizes: 3 <-> 6
                if (viewMode === 'grid-3') setViewMode('grid-6');
                else setViewMode('grid-3');
              }}
              className={`p-2 rounded flex items-center gap-1 transition-all ${
                viewMode !== 'list'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                  : 'text-gray-400 hover:text-amber-400'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="text-xs font-medium">
                {viewMode === 'grid-6' ? '6' : '3'}
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                  : 'text-gray-400 hover:text-amber-400'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
