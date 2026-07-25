'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

export function BarcodeGeneratorStructuredData() {
  const locale = useLocale();
  const t = useTranslations('tools.barcode-generator');

  const structuredData = softwareApplicationJsonLd({
    name: t('title'),
    description: t('description'),
    url: absoluteToolUrl(locale, 'barcode-generator'),
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
