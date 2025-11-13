/**
 * Native Camera Capture Component
 *
 * UI for capturing photos using native camera.
 * File size: ~90 lines (AI-friendly)
 *
 * 📱 Platform: iOS/Android only
 */

'use client';

import { Camera, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNativeCamera } from '../hooks/useNativeCamera';

interface CameraCaptureProps {
  /** Callback when photo is captured */
  onCapture: (imageBlob: Blob) => void;
  /** Callback when user cancels */
  onCancel?: () => void;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg';
  /** Custom button text */
  buttonText?: string;
}

/**
 * Native camera capture button
 *
 * Opens device camera and returns captured image as Blob.
 *
 * @example
 * <CameraCapture
 *   onCapture={(blob) => uploadPhoto(blob)}
 *   buttonText="Scan Label"
 * />
 */
export function CameraCapture({
  onCapture,
  onCancel,
  variant = 'default',
  size = 'default',
  buttonText = 'Capture Photo',
}: CameraCaptureProps) {
  const { image, isCapturing, error, capture, pickFromGallery, reset } = useNativeCamera();

  // Auto-trigger callback when image captured
  if (image && !error) {
    onCapture(image);
    reset();
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main capture button */}
      <Button
        onClick={capture}
        disabled={isCapturing}
        variant={variant}
        size={size}
        className="w-full"
      >
        <Camera className="mr-2 h-5 w-5" />
        {isCapturing ? 'Opening Camera...' : buttonText}
      </Button>

      {/* Gallery picker button */}
      <Button
        onClick={pickFromGallery}
        disabled={isCapturing}
        variant="outline"
        size={size}
        className="w-full"
      >
        <ImageIcon className="mr-2 h-5 w-5" />
        Choose from Gallery
      </Button>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Cancel button (optional) */}
      {onCancel && (
        <Button
          onClick={onCancel}
          variant="ghost"
          size={size}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
