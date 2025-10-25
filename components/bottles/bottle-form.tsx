'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBottle } from '@/app/actions/bottle';

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

export function BottleForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await createBottle(formData);
      if (result.success) {
        router.push('/cellar');
        router.refresh();
      }
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

      {/* Wine Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Wine Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wineName" className="block text-sm font-medium mb-2">
              Wine Name *
            </label>
            <input
              id="wineName"
              name="wineName"
              type="text"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Barolo"
            />
          </div>

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
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="2018"
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
              name="producerName"
              type="text"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Cantina Example"
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
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Nebbiolo"
          />
        </div>
      </div>

      {/* Purchase Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Purchase Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2">
              Quantity *
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
              required
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
              Purchase Price
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
