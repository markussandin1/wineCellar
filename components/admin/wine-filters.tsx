'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WineFiltersProps {
  filters: {
    wineType: string[];
    country: string[];
    status: 'draft' | 'active' | null;
    verified: boolean | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onChange: (filters: any) => void;
}

export function WineFilters({ filters, onChange }: WineFiltersProps) {
  const wineTypes = ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified'];
  const countries = ['France', 'Italy', 'Spain', 'USA', 'Australia', 'Germany', 'Portugal'];

  function clearFilters() {
    onChange({
      wineType: [],
      country: [],
      status: null,
      verified: null,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  }

  const hasActiveFilters =
    filters.wineType.length > 0 ||
    filters.country.length > 0 ||
    filters.status !== null ||
    filters.verified !== null;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Wine Type Filter */}
        <div className="min-w-[180px]">
          <Select
            value={filters.wineType[0] || ''}
            onValueChange={(value) => onChange({ wineType: value ? [value] : [] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vintyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alla typer</SelectItem>
              {wineTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Filter */}
        <div className="min-w-[180px]">
          <Select
            value={filters.country[0] || ''}
            onValueChange={(value) => onChange({ country: value ? [value] : [] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Land" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alla länder</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="min-w-[180px]">
          <Select
            value={filters.status || ''}
            onValueChange={(value) => onChange({ status: value || null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Alla</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="draft">Utkast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="min-w-[180px]">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onChange({ sortBy: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sortera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Skapad</SelectItem>
              <SelectItem value="updated_at">Uppdaterad</SelectItem>
              <SelectItem value="full_name">Namn</SelectItem>
              <SelectItem value="vintage">Årgång</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="min-w-[120px]">
          <Select
            value={filters.sortOrder}
            onValueChange={(value: 'asc' | 'desc') => onChange({ sortOrder: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Fallande</SelectItem>
              <SelectItem value="asc">Stigande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Rensa filter
          </Button>
        )}
      </div>
    </div>
  );
}
