/**
 * Native Camera Plugin Wrapper
 *
 * Wraps @capacitor/camera plugin with app-specific configuration.
 * File size: ~70 lines (within AI-friendly limit)
 *
 * 📱 RELEASE IMPACT: App release required (camera permissions)
 */

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

/**
 * Camera configuration optimized for wine label scanning
 */
export const CAMERA_CONFIG = {
  quality: 90, // High quality for label text recognition
  allowEditing: false, // Direct capture for speed
  resultType: CameraResultType.Uri, // Get file URI
  saveToGallery: false, // Don't clutter user's photos
  correctOrientation: true, // Fix orientation issues
} as const;

/**
 * Capture photo using device camera
 *
 * @returns Photo object with URI to captured image
 * @throws Error if permission denied or camera unavailable
 */
export async function capturePhoto(): Promise<Photo> {
  try {
    const photo = await Camera.getPhoto({
      ...CAMERA_CONFIG,
      source: CameraSource.Camera,
    });
    return photo;
  } catch (error) {
    console.error('Camera capture failed:', error);
    throw new Error('Failed to capture photo');
  }
}

/**
 * Pick photo from device gallery
 *
 * @returns Photo object with URI to selected image
 * @throws Error if permission denied or no photo selected
 */
export async function pickPhoto(): Promise<Photo> {
  try {
    const photo = await Camera.getPhoto({
      ...CAMERA_CONFIG,
      source: CameraSource.Photos,
    });
    return photo;
  } catch (error) {
    console.error('Photo picker failed:', error);
    throw new Error('Failed to pick photo');
  }
}

/**
 * Check camera permission status
 *
 * @returns true if camera permission granted
 */
export async function hasCameraPermission(): Promise<boolean> {
  const status = await Camera.checkPermissions();
  return status.camera === 'granted' && status.photos === 'granted';
}

/**
 * Request camera permissions
 *
 * @returns true if user granted permissions
 */
export async function requestCameraPermission(): Promise<boolean> {
  const status = await Camera.requestPermissions();
  return status.camera === 'granted' && status.photos === 'granted';
}
