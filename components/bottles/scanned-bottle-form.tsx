'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';

import { createBottleFromScan } from '@/app/actions/bottle';

import { useBottleForm } from './form/useBottleForm';
import { BottleFormValues } from './form/schema';
import {
  FieldError,
  PurchaseDetailsFields,
  StorageNotesFields,
  WatchListToggle,
} from './form/sections';
import { WINE_TYPES } from './form/constants';
import { WineCard } from './wine-card';

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
    imageUrl?: string | null; // User's scanned image (for their bottle)
    wineImageUrl?: string | null; // Wine's official image from database
    description?: string;
    tastingNotes?: string;
    aiGeneratedSummary?: string;
  };
  onBack: () => void;
  onSuccess?: () => void;
  initialPlacement?: 'cellar' | 'watchlist';
  userCurrency: string;
}

const WATCHLIST_DESCRIPTION =
  'Keep this wine for reference without adding inventory details. Quantity will be stored as zero.';

export function ScannedBottleForm({
  extractedData,
  onBack,
  onSuccess,
  initialPlacement = 'cellar',
  userCurrency,
}: ScannedBottleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialWatchList = initialPlacement === 'watchlist';

  const { form } = useBottleForm({
    defaultValues: {
      wineName: extractedData.wineName || '',
      producerName: extractedData.producerName || '',
      vintage: extractedData.vintage ? String(extractedData.vintage) : '',
      wineType: extractedData.wineType || '',
      country: extractedData.country || '',
      region: extractedData.region || '',
      subRegion: extractedData.subRegion || '',
      primaryGrape: extractedData.primaryGrape || '',
      existingWineId: extractedData.existingWineId || '',
      purchasePrice: '',
      currency: userCurrency,
      isWatchList: initialWatchList,
      quantity: initialWatchList ? 0 : 1,
    },
  });

  const { handleSubmit, register, watch, setValue } = form;

  useEffect(() => {
    setValue('isWatchList', initialPlacement === 'watchlist', {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [initialPlacement, setValue]);

  const onSubmit = handleSubmit(async (values: BottleFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();

    formData.set('wineName', values.wineName);
    formData.set('producerName', values.producerName);
    if (values.vintage) {
      formData.set('vintage', values.vintage);
    }
    formData.set('wineType', values.wineType);
    formData.set('country', values.country);
    formData.set('region', values.region);
    if (values.subRegion) {
      formData.set('subRegion', values.subRegion);
    }
    if (values.primaryGrape) {
      formData.set('primaryGrape', values.primaryGrape);
    }

    formData.set('bottleSize', String(values.bottleSize));
    formData.set('quantity', String(values.quantity));
    formData.set('status', values.isWatchList ? 'other' : 'in_cellar');
    formData.set('acquisitionMethod', values.isWatchList ? 'other' : values.acquisitionMethod);

    if (values.purchasePrice) {
      formData.set('purchasePrice', values.purchasePrice);
    }
    formData.set('currency', values.currency);
    if (values.purchaseDate) {
      formData.set('purchaseDate', values.purchaseDate);
    }
    if (values.purchaseLocation) {
      formData.set('purchaseLocation', values.purchaseLocation);
    }
    if (values.storageLocation) {
      formData.set('storageLocation', values.storageLocation);
    }
    if (values.personalNotes) {
      formData.set('personalNotes', values.personalNotes);
    }

    if (values.existingWineId) {
      formData.set('existingWineId', values.existingWineId);
    }

    if (extractedData.imageUrl) {
      formData.set('imageUrl', extractedData.imageUrl);
    }

    try {
      const result = await createBottleFromScan(formData);
      if (result.success) {
        if (onSuccess) {
          onSuccess();
          return;
        }

        router.push('/cellar');
        router.refresh();
        return;
      }

      const message = 'error' in result && result.error ? result.error : 'Failed to add bottle';
      setError(message);
      setIsSubmitting(false);
    } catch (submissionError: any) {
      setError(submissionError.message || 'Failed to add bottle');
      setIsSubmitting(false);
    }
  });

  const isWatchList = watch('isWatchList');

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {extractedData.existingWineId ? (
          <>
            {/* Show wine card when wine exists in database */}
            <WineCard
              wine={{
                name: extractedData.wineName,
                producerName: extractedData.producerName,
                vintage: extractedData.vintage,
                wineType: extractedData.wineType,
                country: extractedData.country,
                region: extractedData.region,
                imageUrl: extractedData.wineImageUrl || extractedData.imageUrl, // Prefer wine's official image
              }}
            />

            <WatchListToggle description={WATCHLIST_DESCRIPTION} />

            {/* Separator between Wine and Bottle information - only show when not watch list */}
            {!isWatchList && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">Your Bottle Details</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Fill in information specific to your bottle (price, location, notes, etc.)
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Show banner and full form when creating new wine */}
            <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-4">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    ✨ New wine created
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    This wine has been added to the database with AI-generated details.
                  </p>
                </div>
              </div>
            </div>

            <WatchListToggle description={WATCHLIST_DESCRIPTION} />

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
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('wineName')}
                  />
                  <FieldError name="wineName" />
                </div>

                <div>
                  <label htmlFor="vintage" className="block text-sm font-medium mb-2">
                    Vintage
                  </label>
                  <input
                    id="vintage"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('vintage')}
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
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('producerName')}
                  />
                  <FieldError name="producerName" />
                </div>

                <div>
                  <label htmlFor="wineType" className="block text-sm font-medium mb-2">
                    Wine Type *
                  </label>
                  <select
                    id="wineType"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('wineType')}
                  >
                    <option value="">Select type...</option>
                    {WINE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <FieldError name="wineType" />
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
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('country')}
                  />
                  <FieldError name="country" />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium mb-2">
                    Region *
                  </label>
                  <input
                    id="region"
                    type="text"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('region')}
                  />
                  <FieldError name="region" />
                </div>

                <div>
                  <label htmlFor="subRegion" className="block text-sm font-medium mb-2">
                    Sub-Region
                  </label>
                  <input
                    id="subRegion"
                    type="text"
                    className="w-full rounded-md border bg-background px-3 py-2"
                    {...register('subRegion')}
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
                  className="w-full rounded-md border bg-background px-3 py-2"
                  {...register('primaryGrape')}
                />
              </div>
            </div>

            {/* Separator between Wine and Bottle information - only show when not watch list */}
            {!isWatchList && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4">Your Bottle Details</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Fill in information specific to your bottle (price, location, notes, etc.)
                </p>
              </div>
            )}
          </>
        )}

        <PurchaseDetailsFields />

        <StorageNotesFields />

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
            {isSubmitting ? 'Adding...' : isWatchList ? 'Save to Watch List' : 'Add to Cellar'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
