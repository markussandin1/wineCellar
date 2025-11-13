import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration
 *
 * Defines how the native iOS and Android apps are configured.
 *
 * Documentation: https://capacitorjs.com/docs/config
 */
const config: CapacitorConfig = {
  /**
   * Unique identifier for your app
   * Format: reverse domain notation
   * ⚠️ CANNOT be changed after first App Store submission
   */
  appId: 'com.winecellar.app',

  /**
   * Display name of the app
   * Shows in App Store, home screen, etc.
   */
  appName: 'Wine Cellar',

  /**
   * Directory containing the built web assets
   * Must match Next.js static export output directory
   */
  webDir: 'out',

  /**
   * Server configuration
   */
  server: {
    /**
     * Android uses HTTPS by default to avoid mixed content issues
     */
    androidScheme: 'https',

    /**
     * Development server URL (when running locally)
     * iOS simulator can't reach localhost - use your Mac's local IP
     * Update this IP address if you change networks (home/work/etc)
     * Current IP: 10.90.32.150 (updated 2025-11-13)
     */
    url: 'http://10.90.32.150:3002',
    cleartext: true, // Allow HTTP in development
  },

  /**
   * iOS-specific configuration
   */
  ios: {
    /**
     * Content inset handling
     * 'automatic' handles safe areas automatically
     */
    contentInset: 'automatic',

    /**
     * Scroll enabled by default
     */
    scrollEnabled: true,
  },

  /**
   * Android-specific configuration
   */
  android: {
    /**
     * Allow mixed content (HTTP + HTTPS)
     * Set to false in production for security
     */
    allowMixedContent: false,

    /**
     * Capture back button
     * Let Capacitor handle back navigation
     */
    captureInput: true,
  },

  /**
   * Plugin configuration
   * Configure individual Capacitor plugins
   */
  plugins: {
    /**
     * Push Notifications Plugin
     * 📱 Requires app release
     */
    PushNotifications: {
      /**
       * How notifications are presented when app is in foreground
       */
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    /**
     * Camera Plugin
     * 📱 Requires app release
     */
    Camera: {
      /**
       * Image quality (0-100)
       * 90 is good balance between quality and file size
       */
      quality: 90,

      /**
       * Don't save to device gallery
       * We upload to Supabase instead
       */
      saveToGallery: false,
    },

    /**
     * Status Bar Plugin
     * 📱 Requires app release (first time)
     */
    StatusBar: {
      /**
       * Style matches app theme
       * Will be configured dynamically in code
       */
      style: 'dark',
      backgroundColor: '#0A0A0A', // Deep black from design system
    },

    /**
     * Splash Screen Plugin
     * 📱 Requires app release
     */
    SplashScreen: {
      /**
       * Auto-hide after app loads
       * We'll manually hide when ready
       */
      launchShowDuration: 0,
      launchAutoHide: false,

      /**
       * Background color during splash
       */
      backgroundColor: '#0A0A0A', // Deep black
    },
  },

  /**
   * Build configuration
   */
  cordova: {
    /**
     * Preferences for Cordova compatibility
     * (If needed for specific plugins)
     */
  },
};

export default config;
