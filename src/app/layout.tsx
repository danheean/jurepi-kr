import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Jurepi — Free Online Tools',
  description: 'Collection of free online tools for everyday tasks.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'Jurepi',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

/**
 * Root layout intentionally returns children only. The `[locale]` layout owns
 * the <html lang> / <body> document so the language attribute reflects the
 * active locale (next-intl App Router pattern).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
