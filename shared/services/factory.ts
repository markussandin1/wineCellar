/**
 * Service Factory
 *
 * Creates platform-specific service implementations.
 * File size: ~40 lines (AI-friendly)
 */

import { Platform } from '../platform';
import type { CameraService } from './types';

/**
 * Create platform-specific camera service
 *
 * @returns CameraService implementation for current platform
 */
export function createCameraService(): CameraService {
  if (Platform.isNative) {
    // Dynamic import to avoid bundling native code in web build
    const { NativeCameraService } = require('@/capacitor/services/camera.native');
    return new NativeCameraService();
  }

  // Web implementation (WebRTC)
  const { WebCameraService } = require('@/src/services/camera.web');
  return new WebCameraService();
}
