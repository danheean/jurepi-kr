'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * Developer People Dictionary structured data (JSON-LD) component.
 * Injects SoftwareApplication JSON-LD for search engines and AI crawlers.
 * FAQPage JSON-LD is emitted by DevPeopleFaq (single owner, matches every other tool).
 * Person JSON-LD lives on each spoke route (per-person discovery).
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function DevPeopleStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.dev-people');

  const toolUrl = absoluteToolUrl(locale, 'dev-people');

  const softwareApp = softwareApplicationJsonLd({
    name: t('meta.title'),
    description: t('meta.description'),
    url: toolUrl,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
    />
  );
}
