'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Controller, FormProvider } from 'react-hook-form';
import { Upload, X, Check } from 'lucide-react';

import { createBottle } from '@/app/actions/bottle';
import { Autocomplete } from '@/components/ui/autocomplete';

import { useBottleForm } from './form/useBottleForm';
import { BottleFormValues } from './form/schema';
import {
  FieldError,
  PurchaseDetailsFields,
  StorageNotesFields,
  WatchListToggle,
} from './form/sections';
import { WINE_TYPES } from './form/constants';

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

const WATCHLIST_DESCRIPTION =
  'Save wines you want to remember without adding inventory. Quantity will be stored as zero and purchase fields become optional.';

export function BottleForm({ initialPlacement = 'cellar' }: BottleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedWine, setSelectedWine] = useState<SelectedWine | null>(null);

  const initialWatchList = initialPlacement === 'watchlist';

  const { form } = useBottleForm({
    defaultValues: {
      isWatchList: initialWatchList,
      quantity: initialWatchList ? 0 : 1,
    },
  });

  const { control, handleSubmit, setValue, watch } = form;

  useEffect(() => {
    setValue('isWatchList', initialPlacement === 'watchlist', {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [initialPlacement, setValue]);

  const producerValue = watch('producerName');

  const fetchProducers = useCallback(async (query: string): Promise<string[]> => {
    try {
      const response = await fetch(
        `/api/wines/autocomplete?type=producer&query=${encodeURIComponent(query)}`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.results || [];
    } catch (autocompleteError) {
      console.error('Producer autocomplete error:', autocompleteError);
      return [];
    }
  }, []);

  const fetchWines = useCallback(
    async (query: string): Promise<SelectedWine[]> => {
      try {
        const params = new URLSearchParams({ type: 'wine', query });
        if (producerValue) {
          params.append('producer', producerValue);
        }

        const response = await fetch(`/api/wines/autocomplete?${params.toString()}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.results || [];
      } catch (autocompleteError) {
        console.error('Wine autocomplete error:', autocompleteError);
        return [];
      }
    },
    [producerValue]
  );

  const shouldLockField = (fieldValue: unknown) => {
    if (!selectedWine) return false;
    return !(fieldValue === undefined || fieldValue === null || fieldValue === '');
  };

  const handleWineSelect = (wine: SelectedWine) => {
    setSelectedWine(wine);
    setValue('wineName', wine.name, { shouldDirty: true, shouldValidate: false });
    setValue('producerName', wine.producerName, { shouldDirty: true, shouldValidate: false });
    setValue('wineType', wine.wineType ?? '', { shouldDirty: true, shouldValidate: false });
    setValue('country', wine.country ?? '', { shouldDirty: true, shouldValidate: false });
    setValue('region', wine.region ?? '', { shouldDirty: true, shouldValidate: false });
    setValue('subRegion', wine.subRegion ?? '', { shouldDirty: true });
    setValue('primaryGrape', wine.primaryGrape ?? '', { shouldDirty: true });
    setValue('vintage', wine.vintage ? String(wine.vintage) : '', { shouldDirty: true });
    setValue('existingWineId', wine.id, { shouldDirty: true });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const onSubmit = handleSubmit(async (values: BottleFormValues) => {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();

    formData.set('producerName', values.producerName);
    formData.set('wineName', values.wineName);
    if (values.vintage) {
      formData.set('vintage', values.vintage);
    }
    formData.set('wineType', values.wineType);
    formData.set('country', values.country);
    formData.set('region', values.region);
    formData.set('subRegion', values.subRegion ?? '');
    formData.set('primaryGrape', values.primaryGrape ?? '');
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

    try {
      let imageUrl: string | null = null;
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

      if (imageUrl) {
        formData.append('labelImageUrl', imageUrl);
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
    } catch (submissionError: any) {
      setError(submissionError.message || 'Failed to add bottle');
      setIsSubmitting(false);
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <WatchListToggle description={WATCHLIST_DESCRIPTION} />

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

          {selectedWine?.primaryLabelImageUrl && (
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
                Producer *
              </label>
              <Controller
                control={control}
                name="producerName"
                render={({ field }) => (
                  <Autocomplete
                    id="producerName"
                    name="producerName"
                    value={field.value}
                    onChange={(value) => {
                      setSelectedWine(null);
                      setValue('existingWineId', '', { shouldDirty: true });
                      field.onChange(value);
                    }}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    fetchSuggestions={fetchProducers}
                    placeholder="Marchesi di Barolo"
                    required
                    disabled={shouldLockField(selectedWine?.producerName)}
                  />
                )}
              />
              <FieldError name="producerName" />
            </div>

            <div>
              <label htmlFor="wineName" className="block text-sm font-medium mb-2">
                Wine Name *
              </label>
              <Controller
                control={control}
                name="wineName"
                render={({ field }) => (
                  <Autocomplete
                    id="wineName"
                    name="wineName"
                    value={field.value}
                    onChange={(value) => {
                      setSelectedWine(null);
                      setValue('existingWineId', '', { shouldDirty: true });
                      field.onChange(value);
                    }}
                    onSelect={handleWineSelect}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
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
                )}
              />
              <FieldError name="wineName" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="2018"
                disabled={shouldLockField(selectedWine?.vintage)}
                {...form.register('vintage')}
              />
            </div>

            <div>
              <label htmlFor="wineType" className="block text-sm font-medium mb-2">
                Wine Type *
              </label>
              <select
                id="wineType"
                className="w-full rounded-md border bg-background px-3 py-2"
                disabled={shouldLockField(selectedWine?.wineType)}
                {...form.register('wineType')}
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
                placeholder="Italy"
                disabled={shouldLockField(selectedWine?.country)}
                {...form.register('country')}
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
                placeholder="Piedmont"
                disabled={shouldLockField(selectedWine?.region)}
                {...form.register('region')}
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
                placeholder="Barolo DOCG"
                disabled={shouldLockField(selectedWine?.subRegion)}
                {...form.register('subRegion')}
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
              placeholder="Nebbiolo"
              disabled={shouldLockField(selectedWine?.primaryGrape)}
              {...form.register('primaryGrape')}
            />
          </div>
        </div>

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

        <PurchaseDetailsFields />

        <StorageNotesFields />

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
    </FormProvider>
  );
}
