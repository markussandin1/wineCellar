import Image from 'next/image';
import { Wine, MapPin } from 'lucide-react';
import { WineTypeIcon, type WineType, playfair } from '@/lib/design-system';

interface WineCardProps {
  wine: {
    name: string;
    producerName: string;
    vintage?: number | null;
    wineType?: string | null;
    country?: string | null;
    region?: string | null;
    imageUrl?: string | null;
  };
}

export function WineCard({ wine }: WineCardProps) {
  const wineType = (wine.wineType?.toLowerCase() || null) as WineType | null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410]">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-full blur-2xl" />

      <div className="relative flex gap-4 p-6">
        {/* Wine Information - Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-4">
            <WineTypeIcon type={wineType} className="flex-shrink-0" />
            <div className="flex-1">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-500/30">
                ✓ Found in database
              </span>
            </div>
          </div>

          <h3 className={`${playfair.className} font-semibold text-xl mb-1 text-gray-100`}>
            {wine.name}
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            {wine.producerName}
            {wine.vintage && ` • ${wine.vintage}`}
          </p>

          {(wine.region || wine.country) && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4" />
              {[wine.region, wine.country].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* Label Image - Right side, fills the card height */}
        <div className="relative w-48 flex-shrink-0 -my-6 -mr-6">
          {wine.imageUrl ? (
            <div className="relative w-full h-full min-h-[200px]">
              <Image
                src={wine.imageUrl}
                alt={`${wine.name} label`}
                fill
                className="object-cover"
                sizes="192px"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-[#1A1410]">
              <WineTypeIcon type={wineType} className="w-16 h-16" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
