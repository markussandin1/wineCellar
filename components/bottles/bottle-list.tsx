'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Wine, MapPin, Calendar, DollarSign } from 'lucide-react';
import { BottleFilters } from './bottle-filters';

type Bottle = {
  id: string;
  quantity: number;
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

export function BottleList({ bottles }: { bottles: Bottle[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusBadge = (status: string) => {
    const styles = {
      in_cellar: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      consumed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      gifted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      other: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    const labels: Record<string, string> = {
      in_cellar: 'In cellar',
      consumed: 'Consumed',
      gifted: 'Watch list',
      other: 'Watch list',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.other}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  const getWineTypeColor = (type: string) => {
    const colors = {
      red: 'text-red-600 dark:text-red-400',
      white: 'text-yellow-600 dark:text-yellow-400',
      rose: 'text-pink-600 dark:text-pink-400',
      sparkling: 'text-blue-600 dark:text-blue-400',
      dessert: 'text-amber-600 dark:text-amber-400',
      fortified: 'text-purple-600 dark:text-purple-400',
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <BottleFilters viewMode={viewMode} setViewMode={setViewMode} totalCount={bottles.length} />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bottles.map((bottle) => (
            <Link
              key={bottle.id}
              href={`/bottle/${bottle.id}`}
              className="block rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Label Image */}
              <div className="relative w-full h-48 bg-muted">
                {(bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl) ? (
                  <Image
                    src={bottle.labelImageUrl || bottle.wine?.primaryLabelImageUrl || ''}
                    alt={`${bottle.wine?.name || 'Wine'} label`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Wine className={`h-16 w-16 ${bottle.wine ? getWineTypeColor(bottle.wine.wineType) : 'text-gray-400'}`} />
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Wine className={`h-6 w-6 ${bottle.wine ? getWineTypeColor(bottle.wine.wineType) : 'text-gray-400'}`} />
                  {getStatusBadge(bottle.status)}
                </div>

                <h3 className="font-semibold text-lg mb-1">
                  {bottle.wine?.name || 'Unknown Wine'}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {bottle.wine?.producerName}
                  {bottle.wine?.vintage && ` • ${bottle.wine.vintage}`}
                </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {bottle.wine?.region}, {bottle.wine?.country}
                </div>

                {bottle.purchasePrice && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {bottle.currency} {(parseFloat(bottle.purchasePrice) * bottle.quantity).toFixed(2)}
                      {bottle.quantity > 1 && (
                        <span className="text-xs ml-1">
                          ({bottle.currency} {parseFloat(bottle.purchasePrice).toFixed(2)}/bottle)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {bottle.quantity > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wine className="h-4 w-4" />
                    {bottle.quantity} bottle{bottle.quantity > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {bottle.rating && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={i < bottle.rating! ? 'text-yellow-500' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bottles.map((bottle) => (
            <Link
              key={bottle.id}
              href={`/bottle/${bottle.id}`}
              className="block rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 flex-shrink-0 bg-muted">
                  {bottle.labelImageUrl ? (
                    <Image
                      src={bottle.labelImageUrl}
                      alt={`${bottle.wine?.name || 'Wine'} label`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Wine className={`h-8 w-8 ${bottle.wine ? getWineTypeColor(bottle.wine.wineType) : 'text-gray-400'}`} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold truncate">
                      {bottle.wine?.fullName || 'Unknown Wine'}
                    </h3>
                    {getStatusBadge(bottle.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {bottle.wine?.region}, {bottle.wine?.country}
                    {bottle.purchasePrice && (
                      <>
                        {' • '}
                        {bottle.currency} {(parseFloat(bottle.purchasePrice) * bottle.quantity).toFixed(2)}
                        {bottle.quantity > 1 && (
                          <span className="text-xs">
                            {' '}({bottle.currency} {parseFloat(bottle.purchasePrice).toFixed(2)}/bottle)
                          </span>
                        )}
                      </>
                    )}
                    {bottle.quantity > 0 && ` • ${bottle.quantity} bottle${bottle.quantity > 1 ? 's' : ''}`}
                  </p>
                </div>

                {bottle.rating && (
                  <div className="flex gap-1 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${i < bottle.rating! ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
