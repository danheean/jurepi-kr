import type { MetadataRoute } from 'next';

// Required for output: 'export' — emit a static manifest at build time.
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jurepi — Free Online Tools',
    short_name: 'Jurepi',
    description: 'Collection of free online tools for everyday tasks.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#6c5ce7',
    background_color: '#ffffff',
    categories: ['utilities', 'productivity'],
    screenshots: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
