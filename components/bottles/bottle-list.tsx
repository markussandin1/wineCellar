'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, DollarSign } from 'lucide-react';
import { BottleFilters } from './bottle-filters';
import { BottleLabelImage } from './bottle-label-image';
import { BottleSizeBadge } from './bottle-size-badge';
import { WineGroupCard } from './wine-group-card';
import { WineTypeIcon, type WineType, playfair } from '@/lib/design-system';

type Bottle = {
  id: string;
  quantity: number;
  bottleSize: number;
  purchasePrice: string | null;
  currency: string | null;
  purchaseDate: Date | null;
  storageLocation: string | null;
  status: string;
  rating: number | null;
  labelImageUrl: string | null;
  wine: {
    id: string;
    name: string;
    fullName: string | null;
    vintage: number | null;
    producerName: string;
    wineType: string;
    country: string;
    region: string;
    primaryLabelImageUrl: string | null;
  } | null;
};

export type ViewMode = 'grid-3' | 'grid-6' | 'list' | 'grouped';

export function BottleList({ bottles }: { bottles: Bottle[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');

  // Group bottles by wine
  const groupedBottles = useMemo(() => {
    const groups = new Map<string, { wine: Bottle['wine'], bottles: Bottle[] }>();

    bottles.forEach((bottle) => {
      if (!bottle.wine) return;

      const wineId = bottle.wine.id;
      if (!groups.has(wineId)) {
        groups.set(wineId, { wine: bottle.wine, bottles: [] });
      }
      groups.get(wineId)!.bottles.push(bottle);
    });

    return Array.from(groups.values());
  }, [bottles]);

  const getStatusBadge = (status: string) => {
    const styles = {
      in_cellar: 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30',
      consumed: 'bg-gray-700/50 text-gray-300 border border-gray-600/30',
      gifted: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
      other: 'bg-amber-900/50 text-amber-300 border border-amber-500/30',
    };

    const labels: Record<string, string> = {
      in_cellar: 'In cellar',
      consumed: 'Consumed',
      gifted: 'Watch list',
      other: 'Watch list',
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.other}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  const getGridColumns = () => {
    switch (viewMode) {
      case 'grid-3':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'grid-6':
        return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <BottleFilters viewMode={viewMode} setViewMode={setViewMode} totalCount={bottles.length} />

      {viewMode === 'grouped' ? (
        <div className="space-y-4">
          {groupedBottles.map((group) => {
            if (!group.wine) return null;
            return (
              <WineGroupCard
                key={group.wine.id}
                wine={group.wine}
                bottles={group.bottles}
              />
            );
          })}
        </div>
      ) : viewMode !== 'list' ? (
        <div className={`grid ${getGridColumns()} gap-6`}>
          {bottles.map((bottle) => {
            const wineType = (bottle.wine?.wineType?.toLowerCase() || null) as WineType | null;
            const labelImage = bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl || undefined;

            return (
              <Link
                key={bottle.id}
                href={`/bottle/${bottle.id}`}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] hover:scale-105 transition-all shadow-lg hover:shadow-amber-900/20"
              >
                <BottleLabelImage
                  src={labelImage}
                  alt={`${bottle.wine?.name || 'Wine'} label`}
                  wineType={wineType}
                  className="rounded-none rounded-t-xl rounded-b-[1.75rem]"
                />

                <div className="px-6 pb-6 pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <WineTypeIcon type={wineType} className="w-8 h-8" />
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(bottle.status)}
                      <BottleSizeBadge sizeInMl={bottle.bottleSize} />
                    </div>
                  </div>

                  <h3 className={`${playfair.className} font-semibold text-lg mb-1 text-gray-100`}>
                    {bottle.wine?.name || 'Unknown Wine'}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {bottle.wine?.producerName}
                    {bottle.wine?.vintage && ` • ${bottle.wine.vintage}`}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="h-4 w-4" />
                      {bottle.wine?.region}, {bottle.wine?.country}
                    </div>

                    {bottle.purchasePrice && (
                      <div className="flex items-center gap-2 text-amber-400">
                        <DollarSign className="h-4 w-4" />
                        <span>
                          {bottle.currency} {(parseFloat(bottle.purchasePrice) * bottle.quantity).toFixed(2)}
                          {bottle.quantity > 1 && (
                            <span className="text-xs ml-1 text-gray-400">
                              ({bottle.currency} {parseFloat(bottle.purchasePrice).toFixed(2)}/bottle)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {bottle.quantity > 0 && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <WineTypeIcon type={wineType} className="w-4 h-4" />
                        {bottle.quantity} bottle{bottle.quantity > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {bottle.rating && (
                    <div className="mt-3 pt-3 border-t border-amber-900/20">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={i < bottle.rating! ? 'text-amber-400' : 'text-gray-600'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {bottles.map((bottle) => {
            const wineType = (bottle.wine?.wineType?.toLowerCase() || null) as WineType | null;
            const labelImage = bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl || undefined;

            return (
              <Link
                key={bottle.id}
                href={`/bottle/${bottle.id}`}
                className="block rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] overflow-hidden hover:scale-[1.02] transition-all shadow-lg hover:shadow-amber-900/20"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="w-24 flex-shrink-0">
                    <BottleLabelImage
                      src={labelImage}
                      alt={`${bottle.wine?.name || 'Wine'} label`}
                      wineType={wineType}
                      className="shadow-none"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`${playfair.className} font-semibold truncate text-gray-100`}>
                        {bottle.wine?.fullName || 'Unknown Wine'}
                      </h3>
                      {getStatusBadge(bottle.status)}
                      <BottleSizeBadge sizeInMl={bottle.bottleSize} />
                    </div>
                    <p className="text-sm text-gray-300">
                      {bottle.wine?.region}, {bottle.wine?.country}
                      {bottle.purchasePrice && (
                        <>
                          {' • '}
                          <span className="text-amber-400">
                            {bottle.currency} {(parseFloat(bottle.purchasePrice) * bottle.quantity).toFixed(2)}
                          </span>
                          {bottle.quantity > 1 && (
                            <span className="text-xs text-gray-400">
                              {' '}({bottle.currency} {parseFloat(bottle.purchasePrice).toFixed(2)}/bottle)
                            </span>
                          )}
                        </>
                      )}
                      {bottle.quantity > 0 && (
                        <span className="text-gray-400">
                          {' • '}{bottle.quantity} bottle{bottle.quantity > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>

                  {bottle.rating && (
                    <div className="flex gap-1 flex-shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${i < bottle.rating! ? 'text-amber-400' : 'text-gray-600'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
