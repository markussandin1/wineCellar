'use client';

import { useState, useEffect } from 'react';
import { WineDataTable } from '@/components/admin/wine-table';
import { WineSearchBar } from '@/components/admin/wine-search-bar';
import { WineFilters } from '@/components/admin/wine-filters';
import { Loader2 } from 'lucide-react';

interface Wine {
  id: string;
  name: string;
  full_name: string;
  producer_name: string;
  vintage: number | null;
  wine_type: string;
  primary_grape: string;
  country: string;
  region: string;
  sub_region: string | null;
  appellation: string | null;
  alcohol_percentage: number | null;
  sweetness_level: string | null;
  body: string | null;
  status: 'draft' | 'active';
  verified: boolean;
  primary_label_image_url: string | null;
  userCount: number;
  bottleCount: number;
  created_at: string;
  updated_at: string;
}

interface WineFiltersState {
  search: string;
  wineType: string[];
  country: string[];
  status: 'draft' | 'active' | null;
  verified: boolean | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function WinesCatalogPage() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<WineFiltersState>({
    search: '',
    wineType: [],
    country: [],
    status: null,
    verified: null,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchWines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  async function fetchWines() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (filters.search) params.set('search', filters.search);
      if (filters.wineType.length > 0) params.set('wineType', filters.wineType.join(','));
      if (filters.country.length > 0) params.set('country', filters.country.join(','));
      if (filters.status) params.set('status', filters.status);
      if (filters.verified !== null) params.set('verified', filters.verified.toString());

      const res = await fetch(`/api/admin/wines?${params}`);
      const data = await res.json();

      if (res.ok) {
        setWines(data.wines);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch wines:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(search: string) {
    setFilters({ ...filters, search });
    setPagination({ ...pagination, page: 1 });
  }

  function handleFilterChange(newFilters: Partial<WineFiltersState>) {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, page: 1 });
  }

  function handlePageChange(page: number) {
    setPagination({ ...pagination, page });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Vinkatalog</h1>
        <p className="text-neutral-600 mt-1">
          Hantera och editera viner i katalogen
        </p>
      </div>

      {/* Search */}
      <WineSearchBar onSearch={handleSearch} />

      {/* Filters */}
      <WineFilters filters={filters} onChange={handleFilterChange} />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          Visar {wines.length} av {pagination.total} viner
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <>
          {/* Wine Table */}
          <WineDataTable
            wines={wines}
            onRefresh={fetchWines}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Föregående
              </button>
              <span className="text-sm text-neutral-600">
                Sida {pagination.page} av {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nästa
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
