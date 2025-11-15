'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { WineTypeIcon, type WineType } from '@/lib/design-system';
import { cn } from '@/lib/utils';

type Orientation = 'portrait' | 'landscape' | 'square';

interface BottleLabelImageProps {
  src?: string | null;
  alt: string;
  wineType?: WineType | null;
  className?: string;
  priority?: boolean;
}

/**
 * Displays wine label photography inside a portrait container.
 * Landscape photos are intentionally cropped on the sides so the bottle stays centered.
 */
export function BottleLabelImage({
  src,
  alt,
  wineType,
  className,
  priority,
}: BottleLabelImageProps) {
  const [orientation, setOrientation] = useState<Orientation | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setOrientation(null);
      return;
    }

    let isMounted = true;
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      if (!isMounted) {
        return;
      }

      if (img.naturalWidth === img.naturalHeight) {
        setOrientation('square');
        return;
      }

      setOrientation(img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait');
    };

    img.onerror = () => {
      if (isMounted) {
        setOrientation(null);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  const fitClass =
    orientation === 'landscape'
      ? 'object-cover scale-110'
      : orientation === 'square'
        ? 'object-cover'
        : 'object-cover scale-105';

  return (
    <div
      className={cn(
        'relative aspect-[3/5] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#2A1F1A] via-[#1A1410] to-[#0B0806] shadow-[0_20px_60px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5" />
      {src ? (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 400px"
            className={cn(
              'relative z-10 object-center transition-transform duration-700 ease-out',
              isLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
              fitClass,
            )}
            onLoadingComplete={() => setIsLoaded(true)}
          />
        </>
      ) : (
        <div className="relative z-10 flex h-full items-center justify-center">
          <WineTypeIcon type={wineType || null} className="h-12 w-12 text-amber-200/60" />
        </div>
      )}
    </div>
  );
}
