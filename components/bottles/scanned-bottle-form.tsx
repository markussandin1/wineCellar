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
    wasCreatedNow?: boolean; // TRUE if wine was just created, FALSE if it already existed
    imageUrl?: string | null; // User's scanned image (for their bottle)
    wineImageUrl?: string | null; // Wine's official image from database
    enrichmentData?: any; // Structured enrichment data from wineEnrichmentAgent
    description?: string; // Legacy field
    tastingNotes?: string; // Legacy field
    aiGeneratedSummary?: string; // Legacy field
    enrichmentSucceeded?: boolean; // Whether enrichment completed successfully
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
  const [wineRejected, setWineRejected] = useState(false);
  const [creatingNewWine, setCreatingNewWine] = useState(false);
  const [wineContext, setWineContext] = useState('');

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

  // Handler for "This is not the correct wine" rejection
  const handleRejectWine = async () => {
    if (!wineContext.trim()) {
      setError('Vänligen beskriv vinet för att hjälpa AI:n att skapa en korrekt profil.');
      return;
    }

    setCreatingNewWine(true);
    setError(null);

    try {
      // Call API to create new wine with enrichment using user's context
      const response = await fetch('/api/wines/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extractedData.wineName,
          producerName: extractedData.producerName,
          wineType: extractedData.wineType,
          vintage: extractedData.vintage,
          country: extractedData.country,
          region: extractedData.region,
          subRegion: extractedData.subRegion,
          primaryGrape: extractedData.primaryGrape,
          primaryLabelImageUrl: extractedData.imageUrl,
          runEnrichment: true,
          tastingProfileHints: wineContext,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create wine');
      }

      // Update form with new wine ID
      setValue('existingWineId', result.wine.id);

      // Update extractedData with new wine info
      Object.assign(extractedData, {
        existingWineId: result.wine.id,
        wasCreatedNow: true,
        enrichmentSucceeded: result.enrichmentSucceeded,
        enrichmentData: result.wine.enrichmentData,
        wineImageUrl: result.wine.primaryLabelImageUrl,
      });

      // Clear rejection state
      setWineRejected(false);
      setCreatingNewWine(false);
      setWineContext('');
    } catch (createError: any) {
      setError(createError.message || 'Failed to create new wine');
      setCreatingNewWine(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6 rounded-lg border bg-card p-4 sm:p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* Low confidence warning */}
        {extractedData.confidence < 0.7 && !extractedData.existingWineId && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-500">
              ⚠️ Low confidence scan ({Math.round(extractedData.confidence * 100)}%).
              Please verify the wine details below are correct before saving.
            </p>
          </div>
        )}

        {extractedData.existingWineId && !extractedData.wasCreatedNow ? (
          <>
            {/* Wine ALREADY EXISTED in database */}
            {!wineRejected ? (
              <>
                <WineCard
                  wine={{
                    name: extractedData.wineName,
                    producerName: extractedData.producerName,
                    vintage: extractedData.vintage,
                    wineType: extractedData.wineType,
                    country: extractedData.country,
                    region: extractedData.region,
                    subRegion: extractedData.subRegion,
                    primaryGrape: extractedData.primaryGrape,
                    imageUrl: extractedData.wineImageUrl || extractedData.imageUrl, // Prefer wine's official image
                  }}
                  onReject={() => setWineRejected(true)}
                />

                <WatchListToggle description={WATCHLIST_DESCRIPTION} />
              </>
            ) : (
              <>
                {/* User rejected the wine match - show form to create new wine */}
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-4">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                    ⚠️ Detta är inte rätt vin
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mb-4">
                    Beskriv vad du vet om vinet för att hjälpa AI:n att skapa en korrekt profil.
                  </p>

                  <textarea
                    value={wineContext}
                    onChange={(e) => setWineContext(e.target.value)}
                    placeholder="T.ex. 'Ett mörkt, kraftfullt rött vin från Österrike med bärtoner och kryddighet. Köpt på systembolaget för ca 150 kr.'"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={creatingNewWine}
                  />

                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setWineRejected(false)}
                      disabled={creatingNewWine}
                      className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectWine}
                      disabled={creatingNewWine || !wineContext.trim()}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {creatingNewWine ? 'Skapar nytt vin...' : 'Skapa nytt vin'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Separator between Wine and Bottle information - only show when not watch list and not rejected */}
            {!isWatchList && !wineRejected && (
              <div className="border-t pt-4 sm:pt-6">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Your Bottle Details</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  Fill in information specific to your bottle (price, location, notes, etc.)
                </p>
              </div>
            )}
          </>
        ) : extractedData.existingWineId && extractedData.wasCreatedNow ? (
          <>
            {/* Wine was JUST CREATED - show banner based on enrichment status */}
            {extractedData.enrichmentSucceeded === true ? (
              <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      ✨ New wine added to catalog
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                      This wine was added to our database with AI-generated sommelier notes. Now add your bottle details below.
                    </p>
                  </div>
                </div>
              </div>
            ) : extractedData.enrichmentSucceeded === false ? (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      ⚠️ New wine added (basic info only)
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                      This wine was added to our database with basic label information. AI enrichment temporarily unavailable. You can still add it to your cellar.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Show wine card for newly created wine */}
            <WineCard
              wine={{
                name: extractedData.wineName,
                producerName: extractedData.producerName,
                vintage: extractedData.vintage,
                wineType: extractedData.wineType,
                country: extractedData.country,
                region: extractedData.region,
                subRegion: extractedData.subRegion,
                primaryGrape: extractedData.primaryGrape,
                imageUrl: extractedData.imageUrl, // User's scanned image
              }}
            />

            <WatchListToggle description={WATCHLIST_DESCRIPTION} />

            {/* Separator between Wine and Bottle information - only show when not watch list */}
            {!isWatchList && (
              <div className="border-t pt-4 sm:pt-6">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Your Bottle Details</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  Fill in information specific to your bottle (price, location, notes, etc.)
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* FALLBACK: No wine ID (should not happen with new flow) */}
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-center">
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                  ⚠️ Error: Wine data missing
                </p>
                <p className="text-xs text-red-600 dark:text-red-500 mb-4">
                  Something went wrong during the scan. The wine was not properly created or matched.
                </p>
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Try Again
                </button>
              </div>
            </div>
          </>
        )}

        {/* Only show bottle details fields when wine is not rejected */}
        {!wineRejected && (
          <>
            <PurchaseDetailsFields />

            <StorageNotesFields />

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-4 border-t">
              <button
                type="button"
                onClick={onBack}
                className="rounded-md border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : isWatchList ? 'Save to Watch List' : 'Add to Cellar'}
              </button>
            </div>
          </>
        )}
      </form>
    </FormProvider>
  );
}
