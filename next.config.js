const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';

// Capacitor requires static export
// Enable with: CAPACITOR_BUILD=true npm run build
const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: !isPwaEnabled || isCapacitorBuild, // Disable PWA for Capacitor builds
  register: isPwaEnabled && !isCapacitorBuild,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor
  // When building for iOS/Android: CAPACITOR_BUILD=true npm run build
  ...(isCapacitorBuild && {
    output: 'export',
    images: {
      unoptimized: true, // Required for static export
    },
    trailingSlash: true, // Better compatibility with native webviews
  }),

  // Image configuration for web builds
  ...(!isCapacitorBuild && {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  }),

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // TypeScript path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/shared': './shared',
      '@/capacitor': './capacitor',
    };
    return config;
  },
};

module.exports = withPWA(nextConfig);
