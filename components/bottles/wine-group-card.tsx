'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, ChevronDown, ChevronUp, Edit, Trash2, Wine } from 'lucide-react';
import { BottleLabelImage } from './bottle-label-image';
import { BottleSizeBadge } from './bottle-size-badge';
import { WineTypeIcon, type WineType, playfair } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface WineGroupCardProps {
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
  };
  bottles: Bottle[];
}

export function WineGroupCard({ wine, bottles }: WineGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalBottles = bottles.reduce((sum, bottle) => sum + bottle.quantity, 0);
  const wineType = (wine.wineType?.toLowerCase() || null) as WineType | null;
  const labelImage = wine.primaryLabelImageUrl || bottles[0]?.labelImageUrl || undefined;

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
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.other}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('sv-SE'); // YYYY-MM-DD format
  };

  const formatPrice = (price: string | null, currency: string | null) => {
    if (!price) return '—';
    return `${currency || 'USD'} ${parseFloat(price).toFixed(2)}`;
  };

  // Generate breakdown summary (e.g., "2×2022 (750ml), 1×2023 (1500ml)")
  const breakdown = bottles
    .map(bottle => {
      const size = bottle.bottleSize === 750 ? '' : ` (${bottle.bottleSize}ml)`;
      const vintage = wine.vintage || 'NV';
      return `${bottle.quantity}×${vintage}${size}`;
    })
    .join(', ');

  return (
    <div className="rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410] overflow-hidden shadow-lg">
      {/* Collapsed View - Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-amber-900/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-24 flex-shrink-0">
          <BottleLabelImage
            src={labelImage}
            alt={`${wine.name} label`}
            wineType={wineType}
            className="shadow-none"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/wine/${wine.id}`}
              className="group-hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`${playfair.className} font-semibold text-lg text-gray-100 hover:text-amber-400 transition-colors`}>
                {wine.fullName || wine.name}
              </h3>
            </Link>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Wine className="h-3 w-3" />
              {totalBottles} bottle{totalBottles !== 1 ? 's' : ''}
            </Badge>
          </div>

          <p className="text-sm text-gray-300 mb-2">
            {wine.producerName}
            {wine.vintage && ` • ${wine.vintage}`}
          </p>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {wine.region}, {wine.country}
            </div>
            {!isExpanded && bottles.length > 1 && (
              <span className="text-xs text-gray-500">• {breakdown}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <WineTypeIcon type={wineType} className="w-8 h-8" />
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Expanded View - Bottle Details Table */}
      {isExpanded && (
        <div className="border-t border-amber-900/30 bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-900/20 bg-black/30">
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Vintage</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Size</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Qty</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Purchase Date</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Location</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bottles.map((bottle) => (
                  <tr
                    key={bottle.id}
                    className="border-b border-amber-900/10 hover:bg-amber-900/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-300">
                      {wine.vintage || 'NV'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{bottle.bottleSize}ml</span>
                        <BottleSizeBadge sizeInMl={bottle.bottleSize} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {bottle.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {formatDate(bottle.purchaseDate)}
                    </td>
                    <td className="px-4 py-3 text-amber-400">
                      {formatPrice(bottle.purchasePrice, bottle.currency)}
                      {bottle.quantity > 1 && bottle.purchasePrice && (
                        <div className="text-xs text-gray-500">
                          ({formatPrice(bottle.purchasePrice, bottle.currency)}/bottle)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {bottle.storageLocation || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(bottle.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/bottle/${bottle.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
