import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@repo/database', '@repo/sudoku-engine'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' http://localhost:3001 ws://localhost:3001 http://127.0.0.1:3001 ws://127.0.0.1:3001 *.google.com *.googleapis.com *.gstatic.com *.facebook.net *.facebook.com *.tiktok.com *.tiktok.com *.google-analytics.com; connect-src 'self' http://localhost:3001 ws://localhost:3001 http://127.0.0.1:3001 ws://127.0.0.1:3001 *.google.com *.googleapis.com *.gstatic.com *.facebook.net *.facebook.com *.tiktok.com *.tiktok.com *.google-analytics.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.google.com *.gstatic.com *.facebook.net *.tiktok.com *.google-analytics.com *.googletagmanager.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' blob: data: *.googleusercontent.com *.google.com *.facebook.com *.tiktok.com; font-src 'self' *.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
