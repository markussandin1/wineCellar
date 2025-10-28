'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateBottle } from '@/app/actions/bottle';
import { X, Upload, Trash2 } from 'lucide-react';

type Bottle = {
  id: string;
  bottleSize?: number;
  quantity: number;
  purchasePrice: string | null;
  currency: string | null;
  purchaseDate: Date | null;
  purchaseLocation: string | null;
  storageLocation: string | null;
  personalNotes: string | null;
  rating: number | null;
  tags: string[];
  labelImageUrl: string | null;
  status?: string;
};

const STATUS_OPTIONS = [
  { value: 'in_cellar', label: 'In cellar' },
  { value: 'consumed', label: 'Consumed' },
  { value: 'other', label: 'Watch list' },
];

const BOTTLE_SIZES = [
  { value: 375, label: 'Half Bottle (375ml)' },
  { value: 750, label: 'Standard (750ml)' },
  { value: 1500, label: 'Magnum (1.5L)' },
  { value: 3000, label: 'Double Magnum (3L)' },
  { value: 6000, label: 'Imperial (6L)' },
];

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(bottle.labelImageUrl);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
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
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentImageUrl(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      // Upload new image if selected
      let imageUrl = currentImageUrl;
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

      const data = {
        id: bottle.id,
        bottleSize: formData.get('bottleSize') ? Number(formData.get('bottleSize')) : undefined,
        quantity: formData.get('quantity') ? Number(formData.get('quantity')) : undefined,
        purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
        currency: formData.get('currency') as string || undefined,
        purchaseDate: formData.get('purchaseDate') as string || undefined,
        purchaseLocation: formData.get('purchaseLocation') as string || undefined,
        storageLocation: formData.get('storageLocation') as string || undefined,
        personalNotes: formData.get('personalNotes') as string || undefined,
        rating: formData.get('rating') ? Number(formData.get('rating')) : undefined,
        labelImageUrl: imageUrl || undefined,
        status: (formData.get('status') as string) || undefined,
      };

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

          {/* Label Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">Label Image</label>

            {(currentImageUrl || imagePreview) && (
              <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={imagePreview || currentImageUrl || ''}
                  alt="Bottle label"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {!currentImageUrl && !imagePreview && (
              <div className="text-sm text-muted-foreground">No image uploaded</div>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="label-image-upload"
              />
              <label
                htmlFor="label-image-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                {currentImageUrl || imagePreview ? 'Change Image' : 'Upload Image'}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="bottleSize" className="block text-sm font-medium mb-2">
                Bottle Size
              </label>
              <select
                id="bottleSize"
                name="bottleSize"
                defaultValue={bottle.bottleSize || 750}
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

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={bottle.status || 'in_cellar'}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            Use “Watch list” for bottles you want to track without holding inventory.
          </p>
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
