/**
 * Native Camera Service Implementation
 *
 * Uses Capacitor Camera plugin for iOS/Android camera access.
 * File size: ~60 lines (AI-friendly)
 *
 * 📱 RELEASE IMPACT: App release required (first time)
 */

import type { CameraService } from '@/shared/services/types';
import { CameraPermissionError, CameraCaptureError } from '@/shared/services/types';
import {
  capturePhoto,
  pickPhoto,
  hasCameraPermission,
  requestCameraPermission,
} from '../plugins/camera';

/**
 * Native camera service using Capacitor plugin
 */
export class NativeCameraService implements CameraService {
  /**
   * Capture photo using device camera
   */
  async capture(): Promise<Blob> {
    try {
      // Check/request permission
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new CameraPermissionError();
        }
      }

      // Capture photo
      const photo = await capturePhoto();
      if (!photo.webPath) {
        throw new CameraCaptureError('No photo captured');
      }

      // Convert URI to Blob
      const response = await fetch(photo.webPath);
      return response.blob();
    } catch (error) {
      if (error instanceof CameraPermissionError) throw error;
      throw new CameraCaptureError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Pick photo from gallery
   */
  async pickFromGallery(): Promise<Blob> {
    try {
      const photo = await pickPhoto();
      if (!photo.webPath) {
        throw new CameraCaptureError('No photo selected');
      }

      const response = await fetch(photo.webPath);
      return response.blob();
    } catch (error) {
      throw new CameraCaptureError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check camera permission status
   */
  async hasPermission(): Promise<boolean> {
    return hasCameraPermission();
  }

  /**
   * Request camera permissions
   */
  async requestPermission(): Promise<boolean> {
    return requestCameraPermission();
  }
}
