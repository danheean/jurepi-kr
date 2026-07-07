'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  softwareApplicationJsonLd,
  breadcrumbListJsonLd,
  absoluteToolUrl,
} from '@/lib/seo';

/**
 * Emits SoftwareApplication + BreadcrumbList JSON-LD.
 * This component OWNS these schemas (not emitted elsewhere). Slug is 'find-replace'.
 */
export function FindReplaceStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.find-replace');

  const toolUrl = absoluteToolUrl(locale, 'find-replace');
  const name = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name,
    description,
    url: toolUrl,
  });

  const breadcrumb = breadcrumbListJsonLd([
    { name: 'Home', url: `https://apps.jurepi.kr/${locale}` },
    { name: 'Tools', url: `https://apps.jurepi.kr/${locale}/tools` },
    { name, url: toolUrl },
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
