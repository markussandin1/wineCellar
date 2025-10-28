'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Check } from 'lucide-react';
import { createBottle } from '@/app/actions/bottle';
import { Autocomplete } from '@/components/ui/autocomplete';

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

const BOTTLE_SIZES = [
  { value: 375, label: 'Half Bottle (375ml)' },
  { value: 750, label: 'Standard (750ml)' },
  { value: 1500, label: 'Magnum (1.5L)' },
  { value: 3000, label: 'Double Magnum (3L)' },
  { value: 6000, label: 'Imperial (6L)' },
];

type Placement = 'cellar' | 'watchlist';

interface BottleFormProps {
  initialPlacement?: Placement;
}

interface SelectedWine {
  id: string;
  name: string;
  producerName: string;
  vintage: number | null;
  wineType: string;
  country: string;
  region: string;
  subRegion: string | null;
  primaryGrape: string | null;
  primaryLabelImageUrl: string | null;
}

export function BottleForm({ initialPlacement = 'cellar' }: BottleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const initialWatchList = initialPlacement === 'watchlist';
  const [isWatchList, setIsWatchList] = useState(initialWatchList);
  const [quantityValue, setQuantityValue] = useState<number>(initialWatchList ? 0 : 1);
  const previousQuantityRef = useRef<number>(initialWatchList ? 1 : 1);

  // Autocomplete state
  const [producerValue, setProducerValue] = useState('');
  const [wineNameValue, setWineNameValue] = useState('');
  const [selectedWine, setSelectedWine] = useState<SelectedWine | null>(null);

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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setImagePreview(null);
  }

  // Autocomplete fetch functions
  async function fetchProducers(query: string): Promise<string[]> {
    try {
      const response = await fetch(
        `/api/wines/autocomplete?type=producer&query=${encodeURIComponent(query)}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Producer autocomplete error:', error);
      return [];
    }
  }

  async function fetchWines(query: string): Promise<SelectedWine[]> {
    try {
      const params = new URLSearchParams({
        type: 'wine',
        query,
      });
      if (producerValue) {
        params.append('producer', producerValue);
      }

      const response = await fetch(`/api/wines/autocomplete?${params}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Wine autocomplete error:', error);
      return [];
    }
  }

  function handleWineSelect(wine: SelectedWine) {
    setSelectedWine(wine);
    setWineNameValue(wine.name);
    setProducerValue(wine.producerName);
  }

  const shouldLockField = (fieldValue: unknown) => {
    if (!selectedWine) return false;
    return !(fieldValue === undefined || fieldValue === null || fieldValue === '');
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    // Enforce quantity/status for watch list entries before any uploads
    formData.set('quantity', String(quantityValue));
    formData.set('status', isWatchList ? 'other' : 'in_cellar');
    if (isWatchList) {
      formData.set('acquisitionMethod', 'other');
    }

    if (selectedWine) {
      formData.set('wineName', selectedWine.name);
      formData.set('producerName', selectedWine.producerName);
      if (selectedWine.wineType && WINE_TYPES.some(t => t.value === selectedWine.wineType)) {
        formData.set('wineType', selectedWine.wineType);
      }
      formData.set('country', selectedWine.country);
      formData.set('region', selectedWine.region);
      formData.set('subRegion', selectedWine.subRegion ?? '');
      formData.set('primaryGrape', selectedWine.primaryGrape ?? '');

      if (selectedWine.vintage) {
        formData.set('vintage', String(selectedWine.vintage));
      } else {
        formData.delete('vintage');
      }
    }

    try {
      // Upload image first if selected
      let imageUrl = null;
      if (selectedImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', selectedImage);

        const uploadResponse = await fetch('/api/upload-label', {
          method: 'POST',
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.imageUrl;
      }

      // Add image URL to form data if available
      if (imageUrl) {
        formData.append('labelImageUrl', imageUrl);
      }

      // Add existing wine ID if selected from autocomplete
      if (selectedWine) {
        formData.append('existingWineId', selectedWine.id);
      }

      const result = await createBottle(formData);
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

      <div className="flex items-start justify-between rounded-md border bg-muted/40 px-4 py-3">
        <div className="pr-4">
          <p className="text-sm font-medium">Add to watch list</p>
          <p className="text-xs text-muted-foreground">
            Save wines you want to remember without adding inventory. Quantity will be stored as zero and
            purchase fields are optional.
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

      {/* Wine Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Wine Information</h2>
          {selectedWine && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Using existing wine</span>
            </div>
          )}
        </div>

        {/* Wine Preview (if selected from autocomplete) */}
        {selectedWine && selectedWine.primaryLabelImageUrl && (
          <div className="rounded-lg border bg-muted overflow-hidden">
            <div className="relative w-full h-48">
              <Image
                src={selectedWine.primaryLabelImageUrl}
                alt={`${selectedWine.name} label`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="producerName" className="block text-sm font-medium mb-2">
              Producer * {!selectedWine && <span className="text-xs text-muted-foreground">(start typing for suggestions)</span>}
            </label>
          <Autocomplete
            id="producerName"
            name="producerName"
            value={producerValue}
            onChange={setProducerValue}
            fetchSuggestions={fetchProducers}
            placeholder="Marchesi di Barolo"
            required
            disabled={shouldLockField(selectedWine?.producerName)}
          />
          </div>

          <div>
            <label htmlFor="wineName" className="block text-sm font-medium mb-2">
              Wine Name * {!selectedWine && <span className="text-xs text-muted-foreground">(start typing for suggestions)</span>}
            </label>
            <Autocomplete
              id="wineName"
              name="wineName"
              value={wineNameValue}
              onChange={setWineNameValue}
              onSelect={handleWineSelect}
              fetchSuggestions={fetchWines}
              placeholder="Barolo DOCG"
              required
              disabled={shouldLockField(selectedWine?.name)}
              renderSuggestion={(wine: SelectedWine) => (
                <div>
                  <div className="font-medium">{wine.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {wine.producerName} {wine.vintage ? `• ${wine.vintage}` : ''}
                  </div>
                </div>
              )}
              getSuggestionValue={(wine: SelectedWine) => wine.name}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vintage" className="block text-sm font-medium mb-2">
              Vintage
            </label>
            <input
              id="vintage"
              name="vintage"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 5}
              defaultValue={selectedWine?.vintage || ''}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="2018"
              disabled={shouldLockField(selectedWine?.vintage)}
            />
          </div>

          <div>
            <label htmlFor="wineType" className="block text-sm font-medium mb-2">
              Wine Type *
            </label>
            <select
              id="wineType"
              name="wineType"
              required
              defaultValue={selectedWine?.wineType || ''}
              disabled={shouldLockField(selectedWine?.wineType)}
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
              name="country"
              type="text"
              required
              defaultValue={selectedWine?.country || ''}
              disabled={shouldLockField(selectedWine?.country)}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Italy"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-2">
              Region *
            </label>
            <input
              id="region"
              name="region"
              type="text"
              required
              defaultValue={selectedWine?.region || ''}
              disabled={shouldLockField(selectedWine?.region)}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Piedmont"
            />
          </div>

          <div>
            <label htmlFor="subRegion" className="block text-sm font-medium mb-2">
              Sub-Region
            </label>
            <input
              id="subRegion"
              name="subRegion"
              type="text"
              defaultValue={selectedWine?.subRegion || ''}
              disabled={shouldLockField(selectedWine?.subRegion)}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Barolo DOCG"
            />
          </div>
        </div>

        <div>
          <label htmlFor="primaryGrape" className="block text-sm font-medium mb-2">
            Primary Grape
          </label>
            <input
              id="primaryGrape"
              name="primaryGrape"
              type="text"
              defaultValue={selectedWine?.primaryGrape || ''}
              disabled={shouldLockField(selectedWine?.primaryGrape)}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Nebbiolo"
            />
        </div>
      </div>

      {/* Label Image */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Label Image</h2>

        {!imagePreview ? (
          <div>
            <label
              htmlFor="labelImage"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
              <input
                id="labelImage"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isSubmitting}
              />
            </label>
          </div>
        ) : (
          <div className="relative">
            <div className="relative w-full h-64 rounded-lg overflow-hidden border">
              <Image
                src={imagePreview}
                alt="Label preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isSubmitting}
              className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Purchase Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Purchase Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="bottleSize" className="block text-sm font-medium mb-2">
              Bottle Size *
            </label>
            <select
              id="bottleSize"
              name="bottleSize"
              defaultValue="750"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              {BOTTLE_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

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
              disabled={isWatchList}
              className="w-full rounded-md border bg-background px-3 py-2 disabled:opacity-70"
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
            </label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="45.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the price per individual bottle
            </p>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue="USD"
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
              placeholder="Wine Shop Name"
            />
          </div>
        </div>
      </div>

      {/* Storage & Notes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Storage & Notes</h2>

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
          onClick={() => router.back()}
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Add Bottle'}
        </button>
      </div>
    </form>
  );
}
