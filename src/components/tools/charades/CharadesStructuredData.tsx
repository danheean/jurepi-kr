'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * Charades structured data (JSON-LD) component.
 * Injects SoftwareApplication JSON-LD for search engines and AI crawlers.
 * FAQPage JSON-LD is owned by CharadesFaq (single-owner convention — avoids
 * duplicate structured data blocks).
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function CharadesStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.charades');

  const toolUrl = absoluteToolUrl(locale, 'charades');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }} />;
}
