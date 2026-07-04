import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

export function JsonFormatterStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.json-formatter');

  // URL will be set by platform-engineer via seo module
  const absoluteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://apps.jurepi.kr'}/${locale}/tools/json-formatter`;

  const softwareApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('title'),
    description: t('description'),
    url: absoluteUrl,
    applicationCategory: 'DeveloperApplication',
    softwareRequirements: 'Web browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(softwareApplicationJsonLd),
      }}
    />
  );
}
