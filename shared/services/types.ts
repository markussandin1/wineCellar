/**
 * Service Interface Definitions
 *
 * Platform-agnostic service interfaces.
 * Implementations in src/ (web) and capacitor/ (native).
 *
 * File size: ~60 lines (AI-friendly)
 */

/**
 * Camera Service Interface
 *
 * Implementations:
 * - Web: src/services/camera.web.ts (WebRTC)
 * - Native: capacitor/services/camera.native.ts (Capacitor plugin)
 */
export interface CameraService {
  /**
   * Capture photo using device camera
   * @returns Blob of captured image (JPEG)
   * @throws Error if permission denied or capture fails
   */
  capture(): Promise<Blob>;

  /**
   * Pick photo from device gallery
   * @returns Blob of selected image
   * @throws Error if permission denied or no selection
   */
  pickFromGallery(): Promise<Blob>;

  /**
   * Check if camera permission is granted
   * @returns true if permission granted
   */
  hasPermission(): Promise<boolean>;

  /**
   * Request camera permission from user
   * @returns true if user granted permission
   */
  requestPermission(): Promise<boolean>;
}

/**
 * Error thrown when camera permission is denied
 */
export class CameraPermissionError extends Error {
  constructor(message = 'Camera permission denied') {
    super(message);
    this.name = 'CameraPermissionError';
  }
}

/**
 * Error thrown when camera capture fails
 */
export class CameraCaptureError extends Error {
  constructor(message = 'Failed to capture photo') {
    super(message);
    this.name = 'CameraCaptureError';
  }
}
