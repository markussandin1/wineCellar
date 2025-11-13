/**
 * Web Camera Service Implementation
 *
 * Uses WebRTC MediaDevices API for browser camera access.
 * File size: ~80 lines (AI-friendly)
 *
 * 🌐 Platform: Web only
 */

import type { CameraService } from '@/shared/services/types';
import { CameraPermissionError, CameraCaptureError } from '@/shared/services/types';

/**
 * Web camera service using WebRTC
 *
 * Note: This is a simplified implementation for the web build.
 * The actual camera capture is handled by HTML file inputs in the component.
 */
export class WebCameraService implements CameraService {
  /**
   * Capture photo using browser camera
   *
   * Note: On web, we use HTML <input type="file" capture="environment">
   * This method is here for interface compliance.
   */
  async capture(): Promise<Blob> {
    throw new CameraCaptureError(
      'Direct camera capture not available. Use file input instead.'
    );
  }

  /**
   * Pick photo from file system
   *
   * Note: On web, we use HTML <input type="file">
   * This method is here for interface compliance.
   */
  async pickFromGallery(): Promise<Blob> {
    throw new CameraCaptureError(
      'Gallery picker not available. Use file input instead.'
    );
  }

  /**
   * Check camera permission status
   *
   * On web, permissions are requested when user clicks file input
   */
  async hasPermission(): Promise<boolean> {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  /**
   * Request camera permissions
   *
   * On web, this is handled by the browser when user interacts with file input
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Check if MediaDevices API is available
      if (!('mediaDevices' in navigator)) {
        return false;
      }

      // Try to get user media (will trigger permission prompt)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Stop the stream immediately (we just needed to check permission)
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      // Permission denied or not available
      return false;
    }
  }
}
