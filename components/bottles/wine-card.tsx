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
    subRegion?: string | null;
    primaryGrape?: string | null;
    imageUrl?: string | null;
  };
  showConfidenceWarning?: boolean;
  onReject?: () => void;
}

export function WineCard({ wine, showConfidenceWarning = false, onReject }: WineCardProps) {
  const wineType = (wine.wineType?.toLowerCase() || null) as WineType | null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-900/30 bg-gradient-to-br from-[#2A1F1A] to-[#1A1410]">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-full blur-2xl" />

      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="relative flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
        {/* Wine Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <WineTypeIcon type={wineType} className="flex-shrink-0" />
            <div className="flex-1">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-500/30">
                ✓ Found in database
              </span>
            </div>
          </div>

          <h3 className={`${playfair.className} font-semibold text-lg sm:text-xl mb-1 text-gray-100`}>
            {wine.name}
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            {wine.producerName}
            {wine.vintage && ` • ${wine.vintage}`}
          </p>

          {/* Details grid */}
          <div className="space-y-2">
            {(wine.region || wine.country) && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>
                  {[wine.subRegion, wine.region, wine.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {wine.primaryGrape && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Wine className="h-4 w-4 flex-shrink-0" />
                <span>{wine.primaryGrape}</span>
              </div>
            )}
          </div>

          {/* Reject button if provided */}
          {onReject && (
            <button
              type="button"
              onClick={onReject}
              className="mt-4 text-xs text-amber-400 hover:text-yellow-400 transition-colors font-medium"
            >
              ⚠️ This is not the correct wine
            </button>
          )}
        </div>

        {/* Label Image - Mobile: Below text, Desktop: Right side */}
        <div className="relative w-full sm:w-40 md:w-48 flex-shrink-0 sm:-my-6 sm:-mr-6">
          {wine.imageUrl ? (
            <div className="relative w-full aspect-[3/4] sm:h-full sm:min-h-[200px]">
              <Image
                src={wine.imageUrl}
                alt={`${wine.name} label`}
                fill
                className="object-cover rounded-lg sm:rounded-none"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-[3/4] sm:h-full bg-[#1A1410] rounded-lg sm:rounded-none">
              <WineTypeIcon type={wineType} className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
