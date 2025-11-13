'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Platform } from '@/shared/platform';
import { ScannedBottleForm } from './scanned-bottle-form';

// Dynamically import native camera component (only loaded on native platforms)
const CameraCapture = dynamic(
  () => import('@/capacitor/components/CameraCapture').then((mod) => ({ default: mod.CameraCapture })),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center">Loading camera...</div>,
  }
);

type ScanStep = 'upload' | 'processing' | 'review';

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
  existingWineId?: string; // If we found a match in DB or just created it
  wasCreatedNow?: boolean; // TRUE if wine was just created, FALSE if it already existed
  imageUrl?: string | null; // User's scanned label image URL (for their bottle)
  wineImageUrl?: string | null; // Wine's official label image from database
  enrichmentData?: any; // Wine enrichment data if available
  enrichmentSucceeded?: boolean; // Whether enrichment completed successfully
}

interface LabelScannerProps {
  initialPlacement: 'cellar' | 'watchlist';
  userCurrency: string;
}

export function LabelScanner({ initialPlacement, userCurrency }: LabelScannerProps) {
  const router = useRouter();
  const [step, setStep] = useState<ScanStep>('upload');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle native camera capture (Capacitor)
  const handleNativeCapture = async (imageBlob: Blob) => {
    // Convert Blob to File for consistency with web flow
    const file = new File([imageBlob], `label-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    handleFileSelect(file);
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      // Scan label to extract wine data + search DB + run enrichment if no match
      // NOTE: Enrichment is generated but NOT saved to database yet
      const formData = new FormData();
      formData.append('image', selectedImage);

      const scanResponse = await fetch('/api/scan-label', {
        method: 'POST',
        body: formData,
      });

      if (!scanResponse.ok) {
        const data = await scanResponse.json();
        throw new Error(data.error || 'Failed to scan label');
      }

      const scanData = await scanResponse.json();

      // Validate that we have minimum required data
      if (!scanData.wineName) {
        throw new Error(
          'Label scan could not extract the wine name. Please try again with a clearer photo.'
        );
      }

      // If producer name is missing, use wine name as fallback
      if (!scanData.producerName) {
        console.warn('Producer name not extracted, using wine name as fallback');
        scanData.producerName = scanData.wineName;
      }

      // scanData now contains either:
      // 1. existingWineId (wine found in DB) OR
      // 2. enrichmentData (new wine enrichment generated, not saved yet)
      setExtractedData(scanData);
      setStep('review');
    } catch (err: any) {
      setError(err.message);
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedData(null);
    setError(null);
    setStep('upload');
  };

  // Upload step
  if (step === 'upload') {
    return (
      <div className="space-y-6 rounded-lg border bg-card p-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!selectedImage ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Take a clear photo of the wine label. Make sure the text is readable.
            </p>

            {/* Native camera (iOS/Android) */}
            {Platform.isNative ? (
              <CameraCapture
                onCapture={handleNativeCapture}
                buttonText="Scan Wine Label"
                variant="default"
                size="lg"
              />
            ) : (
              /* Web camera/upload */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-accent"
                >
                  <Camera className="h-12 w-12 text-muted-foreground mb-3" />
                <span className="text-sm font-medium">Take Photo</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Use camera
                </span>
                </button>

                {/* File Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary hover:bg-accent"
                >
                  <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Upload Image</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    From gallery
                  </span>
                </button>
              </div>
            )}

            {/* Hidden inputs (Web only) */}
            {!Platform.isNative && (
              <>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Label preview"
                  fill
                  className="object-contain"
                />
              )}
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-2 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Choose Different Image
              </button>
              <button
                onClick={handleScan}
                disabled={isProcessing}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isProcessing ? 'Scanning...' : 'Scan Label'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Processing step (extraction + search + enrichment if needed)
  if (step === 'processing') {
    return (
      <div className="rounded-lg border bg-card p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="font-semibold">Analyzing label...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Searching catalog and preparing wine profile
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-15 seconds for new wines
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Review step
  if (step === 'review' && extractedData) {
    return (
      <ScannedBottleForm
        extractedData={extractedData}
        onBack={handleReset}
        initialPlacement={initialPlacement}
        userCurrency={userCurrency}
      />
    );
  }

  return null;
}
