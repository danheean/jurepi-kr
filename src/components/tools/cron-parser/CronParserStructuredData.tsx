import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

/**
 * SSR-safe SoftwareApplication JSON-LD (single owner for this tool).
 * Uses `useTranslations` so it lands in the static prerendered HTML.
 */
export function CronParserStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.cron-parser');

  const absoluteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://apps.jurepi.kr'}/${locale}/tools/cron-parser`;

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
