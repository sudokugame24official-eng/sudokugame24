import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  transpilePackages: ['@repo/sudoku-engine', '@repo/ui'],
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
  async redirects() {
    return [
      { source: '/en/blog/sudoku-rules', destination: '/en/learn/sudoku-rules', permanent: true },
      { source: '/en/article/sudoku-rules', destination: '/en/learn/sudoku-rules', permanent: true },
      { source: '/en/knowledge/sudoku-rules', destination: '/en/learn/sudoku-rules', permanent: true },
      { source: '/en/blog/naked-pairs', destination: '/en/learn/naked-pairs', permanent: true },
      { source: '/en/article/naked-pairs', destination: '/en/learn/naked-pairs', permanent: true },
      { source: '/en/knowledge/naked-pairs', destination: '/en/learn/naked-pairs', permanent: true },
      { source: '/en/blog/pointing-pairs', destination: '/en/learn/pointing-pairs', permanent: true },
      { source: '/en/article/pointing-pairs', destination: '/en/learn/pointing-pairs', permanent: true },
      { source: '/en/knowledge/pointing-pairs', destination: '/en/learn/pointing-pairs', permanent: true },
      { source: '/en/blog/swordfish-sudoku', destination: '/en/learn/swordfish-sudoku', permanent: true },
      { source: '/en/article/swordfish-sudoku', destination: '/en/learn/swordfish-sudoku', permanent: true },
      { source: '/en/knowledge/swordfish-sudoku', destination: '/en/learn/swordfish-sudoku', permanent: true },
      { source: '/en/blog/common-sudoku-mistakes', destination: '/en/learn/common-sudoku-mistakes', permanent: true },
      { source: '/en/article/common-sudoku-mistakes', destination: '/en/learn/common-sudoku-mistakes', permanent: true },
      { source: '/en/knowledge/common-sudoku-mistakes', destination: '/en/learn/common-sudoku-mistakes', permanent: true },
      { source: '/en/blog/hidden-pairs', destination: '/en/learn/hidden-pairs', permanent: true },
      { source: '/en/article/hidden-pairs', destination: '/en/learn/hidden-pairs', permanent: true },
      { source: '/en/knowledge/hidden-pairs', destination: '/en/learn/hidden-pairs', permanent: true },
      { source: '/en/blog/locked-candidates', destination: '/en/learn/locked-candidates', permanent: true },
      { source: '/en/article/locked-candidates', destination: '/en/learn/locked-candidates', permanent: true },
      { source: '/en/knowledge/locked-candidates', destination: '/en/learn/locked-candidates', permanent: true },
      { source: '/en/blog/naked-singles', destination: '/en/learn/naked-singles', permanent: true },
      { source: '/en/article/naked-singles', destination: '/en/learn/naked-singles', permanent: true },
      { source: '/en/knowledge/naked-singles', destination: '/en/learn/naked-singles', permanent: true },
      { source: '/en/blog/hidden-singles', destination: '/en/learn/hidden-singles', permanent: true },
      { source: '/en/article/hidden-singles', destination: '/en/learn/hidden-singles', permanent: true },
      { source: '/en/knowledge/hidden-singles', destination: '/en/learn/hidden-singles', permanent: true },
      { source: '/en/blog/how-to-solve-sudoku-faster', destination: '/en/learn/how-to-solve-sudoku-faster', permanent: true },
      { source: '/en/article/how-to-solve-sudoku-faster', destination: '/en/learn/how-to-solve-sudoku-faster', permanent: true },
      { source: '/en/knowledge/how-to-solve-sudoku-faster', destination: '/en/learn/how-to-solve-sudoku-faster', permanent: true },
      { source: '/en/blog/sudoku-rating-system-explained', destination: '/en/learn/sudoku-rating-system-explained', permanent: true },
      { source: '/en/article/sudoku-rating-system-explained', destination: '/en/learn/sudoku-rating-system-explained', permanent: true },
      { source: '/en/knowledge/sudoku-rating-system-explained', destination: '/en/learn/sudoku-rating-system-explained', permanent: true },
      { source: '/en/blog/x-wing-sudoku', destination: '/en/learn/x-wing-sudoku', permanent: true },
      { source: '/en/article/x-wing-sudoku', destination: '/en/learn/x-wing-sudoku', permanent: true },
      { source: '/en/knowledge/x-wing-sudoku', destination: '/en/learn/x-wing-sudoku', permanent: true },
      { source: '/en/blog/jellyfish', destination: '/en/learn/jellyfish', permanent: true },
      { source: '/en/article/jellyfish', destination: '/en/learn/jellyfish', permanent: true },
      { source: '/en/knowledge/jellyfish', destination: '/en/learn/jellyfish', permanent: true },
      { source: '/en/blog/xy-wing', destination: '/en/learn/xy-wing', permanent: true },
      { source: '/en/article/xy-wing', destination: '/en/learn/xy-wing', permanent: true },
      { source: '/en/knowledge/xy-wing', destination: '/en/learn/xy-wing', permanent: true },
      { source: '/en/blog/what-is-sudoku', destination: '/en/learn/what-is-sudoku', permanent: true },
      { source: '/en/article/what-is-sudoku', destination: '/en/learn/what-is-sudoku', permanent: true },
      { source: '/en/knowledge/what-is-sudoku', destination: '/en/learn/what-is-sudoku', permanent: true },
      { source: '/en/blog/xyz-wing', destination: '/en/learn/xyz-wing', permanent: true },
      { source: '/en/article/xyz-wing', destination: '/en/learn/xyz-wing', permanent: true },
      { source: '/en/knowledge/xyz-wing', destination: '/en/learn/xyz-wing', permanent: true },
      { source: '/en/blog/how-to-play-sudoku', destination: '/en/learn/how-to-play-sudoku', permanent: true },
      { source: '/en/article/how-to-play-sudoku', destination: '/en/learn/how-to-play-sudoku', permanent: true },
      { source: '/en/knowledge/how-to-play-sudoku', destination: '/en/learn/how-to-play-sudoku', permanent: true },
      { source: '/en/sudoku-rules', destination: '/en/learn/rules', permanent: true },
      { source: '/fr/regles-du-sudoku', destination: '/fr/learn/rules', permanent: true },
      { source: '/de/sudoku-regeln', destination: '/de/learn/rules', permanent: true }
    ];
  },
};

export default withNextIntl(nextConfig);
