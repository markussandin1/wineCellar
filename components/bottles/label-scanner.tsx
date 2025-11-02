'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ScannedBottleForm } from './scanned-bottle-form';

type ScanStep = 'upload' | 'processing' | 'enriching' | 'review';

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
  existingWineId?: string; // If we found a match in DB
  imageUrl?: string | null; // Uploaded label image URL
  enrichmentData?: any; // Wine enrichment data if available
  estimatedPrice?: {
    amount?: number;
    currency?: string;
    confidence?: number;
    reasoning?: string;
  };
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

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      // Step 1: Scan label to extract wine data
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

      // Step 2: If wine doesn't exist, create it with enrichment
      if (!scanData.existingWineId) {
        console.log('Wine not found, creating with enrichment...');
        setStep('enriching');

        const createResponse = await fetch('/api/wines/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: scanData.wineName,
            producerName: scanData.producerName,
            wineType: scanData.wineType,
            vintage: scanData.vintage,
            country: scanData.country,
            region: scanData.region,
            subRegion: scanData.subRegion,
            primaryGrape: scanData.primaryGrape,
            primaryLabelImageUrl: scanData.imageUrl,
            runEnrichment: true,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          // If wine already exists (race condition), just continue
          if (createResponse.status === 409) {
            console.log('Wine was created by another request, continuing...');
          } else {
            throw new Error(errorData.error || 'Failed to create wine');
          }
        }

        const createData = await createResponse.json();

        // Update scanData with newly created wine ID and enrichment
        if (createData.success && createData.wine) {
          scanData.existingWineId = createData.wine.id;
          scanData.enrichmentData = createData.wine.enrichmentData;
        }
      }

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

            {/* Hidden inputs */}
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

  // Processing step
  if (step === 'processing') {
    return (
      <div className="rounded-lg border bg-card p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="font-semibold">Analyzing label...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Extracting wine information
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Enriching step (creating new wine with AI enrichment)
  if (step === 'enriching') {
    return (
      <div className="rounded-lg border bg-card p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h3 className="font-semibold">Creating wine profile...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generating sommelier-quality tasting notes and details
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-15 seconds
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
