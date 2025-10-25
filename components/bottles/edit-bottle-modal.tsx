'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateBottle } from '@/app/actions/bottle';
import { X } from 'lucide-react';

type Bottle = {
  id: string;
  quantity: number;
  purchasePrice: string | null;
  currency: string | null;
  purchaseDate: Date | null;
  purchaseLocation: string | null;
  storageLocation: string | null;
  personalNotes: string | null;
  rating: number | null;
  tags: string[];
};

export function EditBottleModal({
  bottle,
  onClose,
}: {
  bottle: Bottle;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      id: bottle.id,
      quantity: formData.get('quantity') ? Number(formData.get('quantity')) : undefined,
      purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
      currency: formData.get('currency') as string || undefined,
      purchaseDate: formData.get('purchaseDate') as string || undefined,
      purchaseLocation: formData.get('purchaseLocation') as string || undefined,
      storageLocation: formData.get('storageLocation') as string || undefined,
      personalNotes: formData.get('personalNotes') as string || undefined,
      rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
    };

    try {
      await updateBottle(data);
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update bottle');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Bottle</h2>
          <button onClick={onClose} className="hover:bg-accent rounded-md p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                defaultValue={bottle.quantity}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium mb-2">
                Rating (1-5 stars)
              </label>
              <select
                id="rating"
                name="rating"
                defaultValue={bottle.rating || ''}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="">No rating</option>
                <option value="1">1 star</option>
                <option value="2">2 stars</option>
                <option value="3">3 stars</option>
                <option value="4">4 stars</option>
                <option value="5">5 stars</option>
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
                defaultValue={bottle.purchasePrice || ''}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium mb-2">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue={bottle.currency || 'USD'}
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
                defaultValue={
                  bottle.purchaseDate
                    ? new Date(bottle.purchaseDate).toISOString().split('T')[0]
                    : ''
                }
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
                defaultValue={bottle.purchaseLocation || ''}
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
              defaultValue={bottle.storageLocation || ''}
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
              rows={4}
              defaultValue={bottle.personalNotes || ''}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Any notes about this bottle..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
