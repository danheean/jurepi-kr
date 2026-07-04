'use client';

import { useLocale } from 'next-intl';
import { absoluteToolUrl } from '@/lib/seo';

/**
 * SoftwareApplication JSON-LD for Roulette.
 * FAQPage JSON-LD is owned by RouletteFaq component.
 */
export function RouletteStructuredData() {
  const locale = useLocale();
  const toolUrl = absoluteToolUrl(locale, 'roulette');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: locale === 'ko' ? '결정의 룰렛' : 'Decision Roulette',
    description:
      locale === 'ko'
        ? '선택지를 적어서 돌리면 공정하게 결정해줍니다.'
        : 'Spin to decide fairly from your options.',
    url: toolUrl,
    applicationCategory: 'UtilityApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
