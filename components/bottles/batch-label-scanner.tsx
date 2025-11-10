'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, X, Check, AlertCircle, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { ScannedBottleForm } from './scanned-bottle-form';

type BatchItemStatus = 'pending' | 'processing' | 'ready' | 'error' | 'added';

interface ExtractedData {
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
  imageUrl?: string | null; // User's scanned image
  wineImageUrl?: string | null; // Wine's official image from database
  description?: string;
  tastingNotes?: string;
  aiGeneratedSummary?: string;
}

interface BatchItem {
  id: string;
  file: File;
  preview: string;
  status: BatchItemStatus;
  extractedData?: ExtractedData;
  error?: string;
}

interface BatchLabelScannerProps {
  initialPlacement: 'cellar' | 'watchlist';
  userCurrency: string;
}

const MAX_IMAGES = 20;
const RATE_LIMIT_DELAY = 500; // ms between starting each scan

export function BatchLabelScanner({ initialPlacement, userCurrency }: BatchLabelScannerProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = (files: FileList) => {
    const fileArray = Array.from(files);

    // Validate total count
    if (items.length + fileArray.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed. You selected ${fileArray.length} but already have ${items.length}.`);
      return;
    }

    // Validate and create batch items
    const newItems: BatchItem[] = [];
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`Image ${file.name} is too large (max 10MB)`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();

      reader.onloadend = () => {
        setItems(prev => {
          const existing = prev.find(item => item.id === id);
          if (existing) {
            return prev.map(item =>
              item.id === id
                ? { ...item, preview: reader.result as string }
                : item
            );
          }
          return prev;
        });
      };
      reader.readAsDataURL(file);

      newItems.push({
        id,
        file,
        preview: '',
        status: 'pending',
      });
    }

    setItems(prev => [...prev, ...newItems]);
    setError(null);
  };

  const scanSingleImage = async (item: BatchItem): Promise<{ data?: ExtractedData; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', item.file);

      const response = await fetch('/api/scan-label', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan label');
      }

      const data = await response.json();
      return { data };
    } catch (err: any) {
      return { error: err.message || 'Scan failed' };
    }
  };

  const handleStartScanning = async () => {
    if (items.length === 0) return;

    setIsScanning(true);
    setError(null);

    // Process all images with rate limiting
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Skip already processed items
      if (item.status === 'ready' || item.status === 'added' || item.status === 'error') {
        continue;
      }

      // Update status to processing
      setItems(prev => prev.map(it =>
        it.id === item.id ? { ...it, status: 'processing' } : it
      ));

      // Scan the image
      const result = await scanSingleImage(item);

      // Update with result
      setItems(prev => prev.map(it => {
        if (it.id === item.id) {
          if (result.error) {
            return { ...it, status: 'error', error: result.error };
          }
          return { ...it, status: 'ready', extractedData: result.data };
        }
        return it;
      }));

      // Rate limit: wait before starting next scan
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    setIsScanning(false);

    // Automatically open first ready item for review
    const firstReady = items.findIndex(it => it.status === 'ready');
    if (firstReady !== -1) {
      setCurrentReviewIndex(firstReady);
    }
  };

  const handleReviewNext = () => {
    if (currentReviewIndex === null) return;

    // Mark current as added
    setItems(prev => prev.map((it, idx) =>
      idx === currentReviewIndex ? { ...it, status: 'added' } : it
    ));

    // Show success message
    setShowSuccessMessage(true);

    // Hide success message and move to next after 1.5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);

      // Find next ready item
      const nextReady = items.findIndex((it, idx) =>
        idx > currentReviewIndex && it.status === 'ready'
      );

      if (nextReady !== -1) {
        setCurrentReviewIndex(nextReady);
      } else {
        setCurrentReviewIndex(null);
      }
    }, 1500);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleReset = () => {
    setItems([]);
    setCurrentReviewIndex(null);
    setError(null);
    setIsScanning(false);
  };

  const getStatusIcon = (status: BatchItemStatus) => {
    switch (status) {
      case 'pending':
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'ready':
        return <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>;
      case 'error':
        return <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
          <AlertCircle className="h-3 w-3 text-white" />
        </div>;
      case 'added':
        return <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>;
    }
  };

  const getStatusText = (status: BatchItemStatus) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing...';
      case 'ready': return 'Ready to review';
      case 'error': return 'Error';
      case 'added': return 'Added';
    }
  };

  // If reviewing a specific item
  if (currentReviewIndex !== null && items[currentReviewIndex]?.extractedData) {
    const currentItem = items[currentReviewIndex];
    const remainingCount = items.filter(it => it.status === 'ready').length;

    // Show success overlay
    if (showSuccessMessage) {
      return (
        <div className="rounded-lg border bg-card p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-green-500 p-4 animate-bounce">
              <Check className="h-12 w-12 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                Bottle Added Successfully!
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {remainingCount > 1
                  ? `Loading next bottle... (${remainingCount - 1} more to review)`
                  : 'All done! Returning to queue...'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Reviewing bottle {currentReviewIndex + 1} of {items.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {remainingCount > 1 && `${remainingCount - 1} more ready to review`}
              </p>
            </div>
            <button
              onClick={() => setCurrentReviewIndex(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to queue
            </button>
          </div>
        </div>

        {/* Review form */}
        <ScannedBottleForm
          extractedData={currentItem.extractedData!}
          onBack={() => setCurrentReviewIndex(null)}
          onSuccess={handleReviewNext}
          initialPlacement={initialPlacement}
          userCurrency={userCurrency}
        />
      </div>
    );
  }

  // Main upload/queue view
  return (
    <div className="space-y-6 rounded-lg border bg-card p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload section */}
      {items.length === 0 ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Batch Upload</h3>
            <p className="text-sm text-muted-foreground">
              Upload up to {MAX_IMAGES} wine label images at once. Each will be processed separately.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary hover:bg-accent"
          >
            <Upload className="h-16 w-16 text-muted-foreground mb-4" />
            <span className="text-base font-medium mb-1">Select Images</span>
            <span className="text-sm text-muted-foreground">
              Choose up to {MAX_IMAGES} wine label photos
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files) handleFilesSelect(files);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {items.length} image{items.length !== 1 ? 's' : ''} selected
              </h3>
              <p className="text-sm text-muted-foreground">
                {items.filter(it => it.status === 'added').length} added,{' '}
                {items.filter(it => it.status === 'ready').length} ready,{' '}
                {items.filter(it => it.status === 'processing').length} processing
              </p>
            </div>
            <div className="flex gap-2">
              {!isScanning && items.some(it => it.status === 'pending' || it.status === 'error') && (
                <button
                  onClick={handleStartScanning}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Start Scanning
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={isScanning}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Queue list */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                  item.status === 'ready' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                  item.status === 'error' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                  'bg-muted/40'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border bg-muted">
                  {item.preview && (
                    <Image
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.extractedData?.wineName || item.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(item.status)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  {item.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {item.error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {item.status === 'ready' && (
                    <button
                      onClick={() => setCurrentReviewIndex(index)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Review
                      <ChevronRight className="inline h-3 w-3 ml-1" />
                    </button>
                  )}
                  {item.status !== 'processing' && item.status !== 'added' && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-md p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add more button */}
          {items.length < MAX_IMAGES && !isScanning && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border p-4 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
            >
              Add more images ({MAX_IMAGES - items.length} remaining)
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files) handleFilesSelect(files);
            }}
          />
        </div>
      )}
    </div>
  );
}
