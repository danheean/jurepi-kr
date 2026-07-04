'use client';

import { useLocale, useTranslations } from 'next-intl';
import { absoluteToolUrl, breadcrumbListJsonLd, softwareApplicationJsonLd } from '@/lib/seo';

/**
 * Emits SoftwareApplication + BreadcrumbList JSON-LD.
 * This component OWNS these schemas (not emitted elsewhere).
 */
export function CounterStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.character-counter');

  const toolUrl = absoluteToolUrl(locale, 'character-counter');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  const breadcrumb = breadcrumbListJsonLd([
    { name: 'Home', url: `https://apps.jurepi.kr/${locale}` },
    { name: 'Tools', url: `https://apps.jurepi.kr/${locale}/tools` },
    { name: title, url: toolUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
