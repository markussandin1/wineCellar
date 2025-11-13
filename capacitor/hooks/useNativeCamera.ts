/**
 * Native Camera Hook
 *
 * React hook for using native camera in app.
 * File size: ~60 lines (AI-friendly)
 */

import { useState, useCallback } from 'react';
import { createCameraService } from '@/shared/services/factory';
import type { CameraService } from '@/shared/services/types';

interface UseCameraResult {
  /** Captured image blob */
  image: Blob | null;
  /** Whether camera is currently capturing */
  isCapturing: boolean;
  /** Error message if capture failed */
  error: string | null;
  /** Capture photo using camera */
  capture: () => Promise<void>;
  /** Pick photo from gallery */
  pickFromGallery: () => Promise<void>;
  /** Clear current image and error */
  reset: () => void;
}

/**
 * Hook for using native camera
 *
 * @returns Camera state and actions
 *
 * @example
 * const { image, isCapturing, capture } = useNativeCamera();
 *
 * <button onClick={capture} disabled={isCapturing}>
 *   {isCapturing ? 'Capturing...' : 'Take Photo'}
 * </button>
 */
export function useNativeCamera(): UseCameraResult {
  const [image, setImage] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraService: CameraService = createCameraService();

  const capture = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const blob = await cameraService.capture();
      setImage(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  }, [cameraService]);

  const pickFromGallery = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const blob = await cameraService.pickFromGallery();
      setImage(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick photo');
    } finally {
      setIsCapturing(false);
    }
  }, [cameraService]);

  const reset = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return {
    image,
    isCapturing,
    error,
    capture,
    pickFromGallery,
    reset,
  };
}
