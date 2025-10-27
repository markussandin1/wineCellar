'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBottleFromScan } from '@/app/actions/bottle';

const WINE_TYPES = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'fortified', label: 'Fortified' },
];

const ACQUISITION_METHODS = [
  { value: 'purchased', label: 'Purchased' },
  { value: 'gift', label: 'Gift' },
  { value: 'trade', label: 'Trade' },
  { value: 'other', label: 'Other' },
];

interface ScannedBottleFormProps {
  extractedData: {
    wineName: string;
    producerName: string;
    vintage?: number;
    wineType?: string;
    country?: string;
    region?: string;
    subRegion?: string;
    primaryGrape?: string;
    confidence: number;
    existingWineId?: string;
    imageUrl?: string | null;
    description?: string;
    tastingNotes?: string;
    aiGeneratedSummary?: string;
    estimatedPrice?: {
      amount?: number;
      currency?: string;
      confidence?: number;
      reasoning?: string;
    };
  };
  onBack: () => void;
  initialPlacement?: 'cellar' | 'watchlist';
}

export function ScannedBottleForm({ extractedData, onBack, initialPlacement = 'cellar' }: ScannedBottleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialWatchList = initialPlacement === 'watchlist';
  const [isWatchList, setIsWatchList] = useState(initialWatchList);
  const [quantityValue, setQuantityValue] = useState<number>(initialWatchList ? 0 : 1);
  const previousQuantityRef = useRef<number>(initialWatchList ? 1 : 1);

  // Wine information state (editable)
  const [wineData, setWineData] = useState({
    wineName: extractedData.wineName || '',
    producerName: extractedData.producerName || '',
    vintage: extractedData.vintage?.toString() || '',
    wineType: extractedData.wineType || '',
    country: extractedData.country || '',
    region: extractedData.region || '',
    subRegion: extractedData.subRegion || '',
    primaryGrape: extractedData.primaryGrape || '',
  });

  useEffect(() => {
    if (initialPlacement === 'watchlist') {
      setIsWatchList(true);
      setQuantityValue((prev) => {
        if (prev > 0) {
          previousQuantityRef.current = prev;
        }
        return 0;
      });
    } else {
      setIsWatchList(false);
      setQuantityValue((prev) => (prev === 0 ? previousQuantityRef.current || 1 : prev));
    }
  }, [initialPlacement]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    formData.set('quantity', String(quantityValue));
    formData.set('status', isWatchList ? 'other' : 'in_cellar');
    if (isWatchList) {
      formData.set('acquisitionMethod', 'other');
    }

    // Add wine data
    Object.entries(wineData).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    // Add existing wine ID if we found a match
    if (extractedData.existingWineId) {
      formData.append('existingWineId', extractedData.existingWineId);
    }

    // Add image URL if available
    if (extractedData.imageUrl) {
      formData.append('imageUrl', extractedData.imageUrl);
    }

    try {
      const result = await createBottleFromScan(formData);
      if (result.success) {
        router.push('/cellar');
        router.refresh();
        return;
      }

      const message = 'error' in result && result.error ? result.error : 'Failed to add bottle';
      setError(message);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add bottle');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {extractedData.existingWineId && (
        <div className="rounded-md bg-green-500/10 border border-green-500/20 p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✓ Wine found in database
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Using existing wine information. You can still edit the details below.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between rounded-md border bg-muted/40 px-4 py-3">
        <div className="pr-4">
          <p className="text-sm font-medium">Add to watch list</p>
          <p className="text-xs text-muted-foreground">
            Keep this wine for reference without adding inventory details. Quantity will be stored as zero.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isWatchList}
            onChange={(event) => {
              const checked = event.target.checked;
              setIsWatchList(checked);
              if (checked) {
                if (quantityValue > 0) {
                  previousQuantityRef.current = quantityValue;
                }
                setQuantityValue(0);
              } else {
                setQuantityValue(previousQuantityRef.current || 1);
              }
            }}
            className="h-4 w-4"
          />
          Watch list
        </label>
      </div>

      {/* AI-Extracted Wine Information (Editable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Wine Information</h2>
          <span className="text-xs text-muted-foreground">
            Confidence: {Math.round(extractedData.confidence * 100)}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wineName" className="block text-sm font-medium mb-2">
              Wine Name *
            </label>
            <input
              id="wineName"
              type="text"
              value={wineData.wineName}
              onChange={(e) => setWineData({ ...wineData, wineName: e.target.value })}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="vintage" className="block text-sm font-medium mb-2">
              Vintage
            </label>
            <input
              id="vintage"
              type="number"
              value={wineData.vintage}
              onChange={(e) => setWineData({ ...wineData, vintage: e.target.value })}
              min="1900"
              max={new Date().getFullYear() + 5}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="producerName" className="block text-sm font-medium mb-2">
              Producer *
            </label>
            <input
              id="producerName"
              type="text"
              value={wineData.producerName}
              onChange={(e) => setWineData({ ...wineData, producerName: e.target.value })}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="wineType" className="block text-sm font-medium mb-2">
              Wine Type *
            </label>
            <select
              id="wineType"
              value={wineData.wineType}
              onChange={(e) => setWineData({ ...wineData, wineType: e.target.value })}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">Select type...</option>
              {WINE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-2">
              Country *
            </label>
            <input
              id="country"
              type="text"
              value={wineData.country}
              onChange={(e) => setWineData({ ...wineData, country: e.target.value })}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-2">
              Region *
            </label>
            <input
              id="region"
              type="text"
              value={wineData.region}
              onChange={(e) => setWineData({ ...wineData, region: e.target.value })}
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="subRegion" className="block text-sm font-medium mb-2">
              Sub-Region
            </label>
            <input
              id="subRegion"
              type="text"
              value={wineData.subRegion}
              onChange={(e) => setWineData({ ...wineData, subRegion: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="primaryGrape" className="block text-sm font-medium mb-2">
            Primary Grape
          </label>
          <input
            id="primaryGrape"
            type="text"
            value={wineData.primaryGrape}
            onChange={(e) => setWineData({ ...wineData, primaryGrape: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </div>
      </div>

      {/* Your Bottle Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Bottle Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2">
              Quantity{isWatchList ? '' : ' *'}
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={quantityValue}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) {
                  setQuantityValue(0);
                  if (!isWatchList) {
                    previousQuantityRef.current = 1;
                  }
                } else {
                  setQuantityValue(next);
                  if (!isWatchList && next > 0) {
                    previousQuantityRef.current = next;
                  }
                }
              }}
              required={!isWatchList}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="acquisitionMethod" className="block text-sm font-medium mb-2">
              Acquisition Method
            </label>
            <select
              id="acquisitionMethod"
              name="acquisitionMethod"
              defaultValue="purchased"
              disabled={isWatchList}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              {ACQUISITION_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium mb-2">
              Purchase Price (per bottle)
              {extractedData.estimatedPrice?.amount && extractedData.estimatedPrice.confidence && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (AI estimated - {Math.round(extractedData.estimatedPrice.confidence * 100)}% confidence)
                </span>
              )}
            </label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={extractedData.estimatedPrice?.amount || ''}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
            {extractedData.estimatedPrice?.reasoning && (
              <p className="text-xs text-muted-foreground mt-1">
                {extractedData.estimatedPrice.reasoning}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={extractedData.estimatedPrice?.currency || 'SEK'}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="SEK">SEK</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium mb-2">
              Purchase Date
            </label>
            <input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="purchaseLocation" className="block text-sm font-medium mb-2">
              Purchase Location
            </label>
            <input
              id="purchaseLocation"
              name="purchaseLocation"
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="storageLocation" className="block text-sm font-medium mb-2">
            Storage Location
          </label>
          <input
            id="storageLocation"
            name="storageLocation"
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Rack A, Shelf 3"
          />
        </div>

        <div>
          <label htmlFor="personalNotes" className="block text-sm font-medium mb-2">
            Personal Notes
          </label>
          <textarea
            id="personalNotes"
            name="personalNotes"
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Any notes about this bottle..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          disabled={isSubmitting}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add to Cellar'}
        </button>
      </div>
    </form>
  );
}
