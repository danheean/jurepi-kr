import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * Base64EncoderStructuredData: SoftwareApplication JSON-LD schema.
 * Server-side rendering for SEO.
 * FAQPage is owned by Base64EncoderFaq component (no duplication here).
 */
export function Base64EncoderStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.base64-encoder');

  const toolUrl = absoluteToolUrl(locale, 'base64-encoder');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
    />
  );
}
