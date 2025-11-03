import Image from 'next/image';
import { Wine, MapPin } from 'lucide-react';

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
  const getWineTypeColor = (type?: string | null) => {
    if (!type) return 'text-gray-600';

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
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex gap-4 p-6">
        {/* Wine Information - Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-4">
            <Wine className={`h-6 w-6 flex-shrink-0 ${getWineTypeColor(wine.wineType)}`} />
            <div className="flex-1">
              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✓ Found in database
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-1">
            {wine.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {wine.producerName}
            {wine.vintage && ` • ${wine.vintage}`}
          </p>

          {(wine.region || wine.country) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            <div className="flex items-center justify-center h-full bg-muted">
              <Wine className={`h-16 w-16 ${getWineTypeColor(wine.wineType)}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
