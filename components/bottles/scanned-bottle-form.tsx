'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';

import { createBottleFromScan } from '@/app/actions/bottle';
import type { WineEnrichmentOutput } from '@/lib/ai/agents/wine-enrichment/wine-enrichment.types';

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
import { WineEnrichmentPreview } from './wine-enrichment-preview';

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
    enrichmentData?: WineEnrichmentOutput; // Enrichment data (NOT saved to DB yet if no existingWineId)
    // Original scanned data (before any DB matching overwrites)
    originalScannedData?: {
      wineName: string;
      producerName: string;
      vintage?: number;
      wineType?: string;
      country?: string;
      region?: string;
      subRegion?: string;
      primaryGrape?: string;
    };
  };
  onBack: () => void;
  onSuccess?: () => void;
  initialPlacement?: 'cellar' | 'watchlist';
  userCurrency: string;
}

type FlowState =
  | 'FOUND_EXISTING' // Wine found in DB, show with rejection option
  | 'ENRICHMENT_PREVIEW' // New wine, show enrichment for editing
  | 'WINE_CONFIRMED' // Wine confirmed (existing or newly saved), show bottle form
  | 'ERROR'; // Error state

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

  // State machine state
  const [flowState, setFlowState] = useState<FlowState>(() => {
    if (extractedData.existingWineId) {
      return 'FOUND_EXISTING'; // Wine found in DB
    } else if (extractedData.enrichmentData) {
      return 'ENRICHMENT_PREVIEW'; // New wine, show preview
    } else {
      return 'ERROR'; // No wine ID and no enrichment
    }
  });

  // Wine rejection flow
  const [wineContext, setWineContext] = useState('');
  const [creatingNewWine, setCreatingNewWine] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  // Wine ID (updated when wine is created)
  const [confirmedWineId, setConfirmedWineId] = useState<string | undefined>(
    extractedData.existingWineId
  );

  // Enrichment data (updated when user edits)
  const [enrichmentData, setEnrichmentData] = useState<WineEnrichmentOutput | undefined>(
    extractedData.enrichmentData
  );

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

  // Update form when wine is confirmed
  useEffect(() => {
    if (confirmedWineId) {
      setValue('existingWineId', confirmedWineId);
    }
  }, [confirmedWineId, setValue]);

  const isWatchList = watch('isWatchList');

  // Handler: User rejects matched wine
  const handleRejectWine = async () => {
    if (!wineContext.trim()) {
      setError('Please describe the wine to help create an accurate profile.');
      return;
    }

    setCreatingNewWine(true);
    setError(null);

    try {
      // IMPORTANT: Use original scanned data, NOT the matched wine's data
      // When a wine is matched, extractedData is overwritten with DB wine data
      // But we need the original scanned label data for enrichment
      const originalData = extractedData.originalScannedData || extractedData;

      // Run enrichment with user context (in memory, not saved to DB yet)
      const response = await fetch('/api/scan-label/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: originalData.wineName,
          producerName: originalData.producerName,
          wineType: originalData.wineType,
          vintage: originalData.vintage,
          country: originalData.country,
          region: originalData.region,
          subRegion: originalData.subRegion,
          primaryGrape: originalData.primaryGrape,
          tastingProfileHints: wineContext,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate wine profile');
      }

      // Update enrichment data and switch to preview state
      setEnrichmentData(result.enrichmentData);
      setFlowState('ENRICHMENT_PREVIEW');
      setShowRejectionForm(false);
      setCreatingNewWine(false);
      setWineContext('');
    } catch (enrichError: any) {
      setError(enrichError.message || 'Failed to generate wine profile');
      setCreatingNewWine(false);
    }
  };

  // Handler: User saves enrichment (creates wine in DB)
  const handleSaveEnrichment = async (editedEnrichment: WineEnrichmentOutput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // IMPORTANT: Use original scanned data if available (wine rejection flow)
      // Otherwise use extractedData (new wine flow)
      const originalData = extractedData.originalScannedData || extractedData;

      const response = await fetch('/api/wines/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: originalData.wineName,
          producerName: originalData.producerName,
          wineType: originalData.wineType,
          vintage: originalData.vintage,
          country: originalData.country,
          region: originalData.region,
          subRegion: originalData.subRegion,
          primaryGrape: originalData.primaryGrape,
          primaryLabelImageUrl: extractedData.imageUrl, // Keep image from extractedData
          enrichmentData: editedEnrichment, // User-edited enrichment
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save wine');
      }

      // Wine created successfully, update state
      setConfirmedWineId(result.wine.id);
      setFlowState('WINE_CONFIRMED');
      setIsSubmitting(false);
    } catch (saveError: any) {
      setError(saveError.message || 'Failed to save wine');
      setIsSubmitting(false);
    }
  };

  // Handler: User cancels enrichment preview
  const handleCancelEnrichment = () => {
    // Go back to scan
    onBack();
  };

  // Handler: Submit bottle form
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

    if (confirmedWineId) {
      formData.set('existingWineId', confirmedWineId);
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

  // STATE: ENRICHMENT_PREVIEW - Show enrichment for editing
  if (flowState === 'ENRICHMENT_PREVIEW' && enrichmentData) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <WineEnrichmentPreview
          initialData={enrichmentData}
          wineName={extractedData.wineName}
          producerName={extractedData.producerName}
          vintage={extractedData.vintage}
          onSave={handleSaveEnrichment}
          onCancel={handleCancelEnrichment}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // STATE: FOUND_EXISTING or WINE_CONFIRMED - Show wine card + bottle form
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6 rounded-lg border bg-card p-4 sm:p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {/* Low confidence warning */}
        {extractedData.confidence < 0.7 && flowState === 'FOUND_EXISTING' && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-500">
              ⚠️ Low confidence scan ({Math.round(extractedData.confidence * 100)}%).
              Please verify this is the correct wine.
            </p>
          </div>
        )}

        {/* FOUND_EXISTING: Wine found in database */}
        {flowState === 'FOUND_EXISTING' && !showRejectionForm && (
          <>
            <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✓ Found in catalog
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                This wine is already in our database. Please verify it&apos;s the correct match.
              </p>
            </div>

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
                imageUrl: extractedData.wineImageUrl || extractedData.imageUrl,
              }}
              onReject={() => setShowRejectionForm(true)}
            />
          </>
        )}

        {/* FOUND_EXISTING: Rejection form */}
        {flowState === 'FOUND_EXISTING' && showRejectionForm && (
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
              ⚠️ This is not the correct wine
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-4">
              Please describe what you know about the wine to help create an accurate profile.
            </p>

            <textarea
              value={wineContext}
              onChange={(e) => setWineContext(e.target.value)}
              placeholder="e.g., 'A bold red wine from Austria with dark berry flavors and spice. Purchased at the wine shop for about $20.'"
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={creatingNewWine}
            />

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowRejectionForm(false)}
                disabled={creatingNewWine}
                className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectWine}
                disabled={creatingNewWine || !wineContext.trim()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {creatingNewWine ? 'Preparing wine profile...' : 'Create New Wine'}
              </button>
            </div>
          </div>
        )}

        {/* WINE_CONFIRMED: Wine saved, show confirmation */}
        {flowState === 'WINE_CONFIRMED' && (
          <>
            <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                ✓ Saved to catalog
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Wine profile has been saved. Now add your bottle details below.
              </p>
            </div>

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
                imageUrl: extractedData.imageUrl,
              }}
            />
          </>
        )}

        {/* ERROR: Fallback error state */}
        {flowState === 'ERROR' && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-center">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                ⚠️ Error: Wine data missing
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mb-4">
                Something went wrong during the scan. Please try again.
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
        )}

        {/* Bottle form fields - only show when not in rejection form and not in error */}
        {flowState !== 'ERROR' && !showRejectionForm && (
          <>
            <WatchListToggle description={WATCHLIST_DESCRIPTION} />

            {!isWatchList && (
              <div className="border-t pt-4 sm:pt-6">
                <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Your Bottle Details</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  Fill in information specific to your bottle (price, location, notes, etc.)
                </p>
              </div>
            )}

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
