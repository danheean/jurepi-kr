import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

/**
 * SoftwareApplication JSON-LD (SINGLE owner of SoftwareApplication for jwt-decoder).
 * Emits structured data for search engines to understand the tool.
 * Does NOT emit FAQPage (that is owned by JwtDecoderFaq).
 *
 * URL must match canonical used in metadata (via NEXT_PUBLIC_SITE_URL).
 */
export function JwtDecoderStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.jwt-decoder');

  // URL must match canonical from buildToolMetadata
  const absoluteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://apps.jurepi.kr'}/${locale}/tools/jwt-decoder`;

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
