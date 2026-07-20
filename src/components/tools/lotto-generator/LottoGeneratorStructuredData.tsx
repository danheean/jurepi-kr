'use client';

import { useLocale } from 'next-intl';
import { absoluteToolUrl } from '@/lib/seo';

/**
 * SoftwareApplication JSON-LD for Lotto Generator.
 * FAQPage JSON-LD is owned by LottoGeneratorFaq component.
 */
export function LottoGeneratorStructuredData() {
  const locale = useLocale();
  const toolUrl = absoluteToolUrl(locale, 'lotto-generator');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: locale === 'ko' ? '로또 번호 생성기' : 'Lotto Number Generator',
    description:
      locale === 'ko'
        ? '공정하게 로또 번호를 생성하세요. 당첨을 보장하지는 않습니다.'
        : 'Generate fair lotto numbers. No guarantee of winning.',
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
