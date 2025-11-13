/**
 * Platform Detection Utility
 *
 * Provides centralized platform detection for web, iOS, and Android.
 * Use this instead of direct Capacitor.getPlatform() calls throughout the app.
 *
 * @example
 * import { Platform } from '@/shared/platform';
 *
 * if (Platform.isNative) {
 *   // Native app logic
 * } else {
 *   // Web logic
 * }
 */

import { Capacitor } from '@capacitor/core';

/**
 * Platform detection constants
 *
 * All platform checks should use these constants for consistency.
 */
export const Platform = {
  /**
   * Returns true if running as a native app (iOS or Android)
   */
  isNative: Capacitor.isNativePlatform(),

  /**
   * Returns true if running in a web browser
   */
  isWeb: !Capacitor.isNativePlatform(),

  /**
   * Returns true if running on iOS (native app)
   */
  isIOS: Capacitor.getPlatform() === 'ios',

  /**
   * Returns true if running on Android (native app)
   */
  isAndroid: Capacitor.getPlatform() === 'android',

  /**
   * Returns the current platform name
   * Possible values: 'web', 'ios', 'android'
   */
  name: Capacitor.getPlatform(),
} as const;

/**
 * Check if a feature requires app store release
 *
 * Features that require native permissions or Capacitor plugins
 * need an app store release to be activated.
 *
 * @param feature - Feature name to check
 * @returns true if feature requires app release
 *
 * @example
 * if (requiresAppRelease('camera')) {
 *   console.log('📱 This feature needs app store release');
 * }
 */
export function requiresAppRelease(feature: string): boolean {
  const appFeatures = [
    'camera',
    'push-notifications',
    'haptics',
    'background-fetch',
    'face-id',
    'fingerprint',
    'status-bar',
    'safe-area',
    'geolocation',
    'contacts',
    'calendar',
    'share',
    'filesystem',
  ];

  return appFeatures.includes(feature.toLowerCase());
}

/**
 * Get user-friendly platform name
 *
 * @returns Human-readable platform name
 *
 * @example
 * getPlatformName() // Returns: 'iOS', 'Android', or 'Web'
 */
export function getPlatformName(): string {
  if (Platform.isIOS) return 'iOS';
  if (Platform.isAndroid) return 'Android';
  return 'Web';
}

/**
 * Check if platform supports a specific web API
 *
 * @param api - Web API name to check
 * @returns true if API is supported
 *
 * @example
 * if (supportsWebAPI('mediaDevices')) {
 *   // Use WebRTC camera
 * }
 */
export function supportsWebAPI(api: string): boolean {
  if (typeof window === 'undefined') return false;

  switch (api) {
    case 'mediaDevices':
      return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    case 'notification':
      return 'Notification' in window;
    case 'storage':
      return 'localStorage' in window;
    default:
      return false;
  }
}
