/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Avoid requiring TypeScript during production builds on Render
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['supabase.co', 'localhost', 'vfqhvkufsdntswftrith.supabase.co', 'images.unsplash.com'],
    formats: ['image/webp'],
  },
  webpack: (config) => {
    // Ensure TS path alias `@/*` works in all environments (e.g., Render)
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
