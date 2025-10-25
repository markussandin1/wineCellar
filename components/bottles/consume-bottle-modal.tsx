'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { consumeBottle } from '@/app/actions/bottle';
import { X } from 'lucide-react';

type Bottle = {
  id: string;
  quantity: number;
};

export function ConsumeBottleModal({
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
      bottleId: bottle.id,
      consumedDate: formData.get('consumedDate') as string,
      rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
      tastingNotes: formData.get('tastingNotes') as string || undefined,
      occasion: formData.get('occasion') as string || undefined,
      location: formData.get('location') as string || undefined,
      companions: [],
      quantityConsumed: Number(formData.get('quantityConsumed') || 1),
    };

    try {
      await consumeBottle(data);
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as consumed');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Mark as Consumed</h2>
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
              <label htmlFor="consumedDate" className="block text-sm font-medium mb-2">
                Date Consumed *
              </label>
              <input
                id="consumedDate"
                name="consumedDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="quantityConsumed" className="block text-sm font-medium mb-2">
                Quantity Consumed *
              </label>
              <input
                id="quantityConsumed"
                name="quantityConsumed"
                type="number"
                min="1"
                max={bottle.quantity}
                defaultValue="1"
                required
                className="w-full rounded-md border bg-background px-3 py-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bottle.quantity} bottle{bottle.quantity > 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="rating" className="block text-sm font-medium mb-2">
              Rating (1-5 stars)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    className="sr-only peer"
                  />
                  <span className="text-3xl text-gray-300 peer-checked:text-yellow-500 hover:text-yellow-400">
                    ★
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="occasion" className="block text-sm font-medium mb-2">
              Occasion
            </label>
            <input
              id="occasion"
              name="occasion"
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Dinner party, quiet evening, etc."
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="Where did you drink this?"
            />
          </div>

          <div>
            <label htmlFor="tastingNotes" className="block text-sm font-medium mb-2">
              Tasting Notes
            </label>
            <textarea
              id="tastingNotes"
              name="tastingNotes"
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2"
              placeholder="How did it taste? What did you think?"
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
              {isSubmitting ? 'Saving...' : 'Mark as Consumed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
