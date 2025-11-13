/**
 * Feature Flags System
 *
 * Centralized feature toggles for gradual rollout and platform-specific features.
 *
 * @example
 * import { Features } from '@/shared/features';
 *
 * {Features.PUSH_NOTIFICATIONS && <NotificationPrompt />}
 */

import { Platform } from './platform';

/**
 * Feature flags configuration
 *
 * Features are divided into categories:
 * - Web features: Can be toggled via environment variables
 * - App features: Always enabled in native apps
 * - Platform-specific features: iOS or Android only
 */
export const Features = {
  // ==================
  // Web Features
  // ==================
  // These can be toggled via NEXT_PUBLIC_FEATURE_* environment variables

  /**
   * Batch scanning: Upload multiple wine labels at once
   * 🌐 Web deploy only
   */
  BATCH_SCANNING: process.env.NEXT_PUBLIC_FEATURE_BATCH === 'true',

  /**
   * AI wine enrichment in admin panel
   * 🌐 Web deploy only
   */
  AI_ENRICHMENT: process.env.NEXT_PUBLIC_FEATURE_AI !== 'false', // Enabled by default

  /**
   * Admin panel access
   * 🌐 Web deploy only
   */
  ADMIN_PANEL: process.env.NEXT_PUBLIC_FEATURE_ADMIN !== 'false', // Enabled by default

  // ==================
  // App Features
  // ==================
  // These are always enabled in native apps, disabled in web

  /**
   * Push notifications for wine recommendations and reminders
   * 📱 App release required (first time)
   */
  PUSH_NOTIFICATIONS: Platform.isNative,

  /**
   * Haptic feedback for interactions
   * 📱 App release required (first time)
   */
  HAPTIC_FEEDBACK: Platform.isNative,

  /**
   * Background sync for offline scans
   * 📱 App release required (first time)
   */
  BACKGROUND_SYNC: Platform.isNative,

  /**
   * Native camera with better quality and controls
   * 📱 App release required (first time)
   */
  NATIVE_CAMERA: Platform.isNative,

  /**
   * Native share sheet
   * 📱 App release required (first time)
   */
  NATIVE_SHARE: Platform.isNative,

  // ==================
  // iOS-Specific Features
  // ==================

  /**
   * Face ID / Touch ID authentication
   * 📱 App release required (first time) - iOS only
   */
  FACE_ID: Platform.isIOS,

  /**
   * Apple Pay integration (future)
   * 📱 App release required - iOS only
   */
  APPLE_PAY: Platform.isIOS && process.env.NEXT_PUBLIC_FEATURE_APPLE_PAY === 'true',

  /**
   * iOS Widgets (future)
   * 📱 App release required - iOS only
   */
  IOS_WIDGETS: Platform.isIOS && process.env.NEXT_PUBLIC_FEATURE_WIDGETS === 'true',

  // ==================
  // Android-Specific Features
  // ==================

  /**
   * Fingerprint authentication
   * 📱 App release required (first time) - Android only
   */
  FINGERPRINT: Platform.isAndroid,

  /**
   * Google Pay integration (future)
   * 📱 App release required - Android only
   */
  GOOGLE_PAY: Platform.isAndroid && process.env.NEXT_PUBLIC_FEATURE_GOOGLE_PAY === 'true',
} as const;

/**
 * Feature names type
 */
export type FeatureName = keyof typeof Features;

/**
 * Check if a feature is enabled
 *
 * @param feature - Feature name to check
 * @returns true if feature is enabled
 *
 * @example
 * if (isFeatureEnabled('PUSH_NOTIFICATIONS')) {
 *   await requestPushPermissions();
 * }
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  return Features[feature];
}

/**
 * Get all enabled features
 *
 * @returns Array of enabled feature names
 *
 * @example
 * const enabled = getEnabledFeatures();
 * console.log('Enabled features:', enabled);
 */
export function getEnabledFeatures(): FeatureName[] {
  return (Object.keys(Features) as FeatureName[]).filter(
    (key) => Features[key]
  );
}

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';
