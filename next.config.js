const isPwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: !isPwaEnabled,
  register: isPwaEnabled,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = withPWA(nextConfig);
