'use client';

import { useFormContext } from 'react-hook-form';
import clsx from 'clsx';

import { ACQUISITION_METHODS, BOTTLE_SIZES, CURRENCY_OPTIONS } from './constants';
import { BottleFormValues } from './schema';

export function FieldError({ name }: { name: keyof BottleFormValues }) {
  const {
    formState: { errors },
  } = useFormContext<BottleFormValues>();

  const message = errors[name]?.message;
  if (!message || typeof message !== 'string') return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function WatchListToggle({ description }: { description: string }) {
  const { watch, setValue } = useFormContext<BottleFormValues>();
  const isWatchList = watch('isWatchList');

  return (
    <div className="flex items-start justify-between rounded-md border bg-muted/40 px-4 py-3">
      <div className="pr-4">
        <p className="text-sm font-medium">Add to watch list</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={isWatchList}
          onChange={(event) =>
            setValue('isWatchList', event.target.checked, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
          className="h-4 w-4"
        />
        Watch list
      </label>
    </div>
  );
}

export function PurchaseDetailsFields() {
  const { register, watch } = useFormContext<BottleFormValues>();
  const isWatchList = watch('isWatchList');

  // Don't show purchase details for watch list items
  if (isWatchList) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Purchase Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="bottleSize" className="block text-sm font-medium mb-2">
            Bottle Size *
          </label>
          <select
            id="bottleSize"
            className="w-full rounded-md border bg-background px-3 py-2"
            {...register('bottleSize', { valueAsNumber: true })}
          >
            {BOTTLE_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
          <FieldError name="bottleSize" />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-2">
            Quantity *
          </label>
          <input
            id="quantity"
            type="number"
            min={0}
            className="w-full rounded-md border bg-background px-3 py-2"
            {...register('quantity', { valueAsNumber: true })}
          />
          <FieldError name="quantity" />
        </div>

        <div>
          <label htmlFor="acquisitionMethod" className="block text-sm font-medium mb-2">
            Acquisition Method
          </label>
          <select
            id="acquisitionMethod"
            className="w-full rounded-md border bg-background px-3 py-2"
            {...register('acquisitionMethod')}
          >
            {ACQUISITION_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          <FieldError name="acquisitionMethod" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium mb-2">
            Purchase Price (per bottle)
          </label>
          <input
            id="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="45.00"
            {...register('purchasePrice')}
          />
          <FieldError name="purchasePrice" />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-2">
            Currency
          </label>
          <select
            id="currency"
            className="w-full rounded-md border bg-background px-3 py-2"
            {...register('currency')}
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <FieldError name="currency" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium mb-2">
            Purchase Date
          </label>
          <input
            id="purchaseDate"
            type="date"
            className="w-full rounded-md border bg-background px-3 py-2"
            {...register('purchaseDate')}
          />
          <FieldError name="purchaseDate" />
        </div>

        <div>
          <label htmlFor="purchaseLocation" className="block text-sm font-medium mb-2">
            Purchase Location
          </label>
          <input
            id="purchaseLocation"
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Wine Shop Name"
            {...register('purchaseLocation')}
          />
          <FieldError name="purchaseLocation" />
        </div>
      </div>
    </div>
  );
}

export function StorageNotesFields() {
  const { register, watch } = useFormContext<BottleFormValues>();
  const isWatchList = watch('isWatchList');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{isWatchList ? 'Notes' : 'Storage & Notes'}</h2>

      {!isWatchList && (
        <div>
          <label htmlFor="storageLocation" className="block text-sm font-medium mb-2">
            Storage Location
          </label>
          <input
            id="storageLocation"
            type="text"
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Rack A, Shelf 3"
            {...register('storageLocation')}
          />
        </div>
      )}

      <div>
        <label htmlFor="personalNotes" className="block text-sm font-medium mb-2">
          {isWatchList ? 'Notes (Why do you want this wine?)' : 'Personal Notes'}
        </label>
        <textarea
          id="personalNotes"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2"
          placeholder={isWatchList ? "e.g., Saw at restaurant, want to try..." : "Any notes about this bottle..."}
          {...register('personalNotes')}
        />
      </div>
    </div>
  );
}
