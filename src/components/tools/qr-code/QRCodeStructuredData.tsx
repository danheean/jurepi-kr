'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, faqPageJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * QR Code Generator structured data (JSON-LD) component.
 * Injects SoftwareApplication and FAQPage JSON-LD for search engines and AI crawlers.
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function QRCodeStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.qr-code');

  const toolUrl = absoluteToolUrl(locale, 'qr-code');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  // Extract FAQ items from i18n using t.raw to preserve object structure
  const faqItems = t.raw('faq.items') as Array<{ q: string; a: string }>;
  const faqPage = faqPageJsonLd(faqItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
