import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * URL Encoder structured data (JSON-LD) component.
 * Injects SoftwareApplication JSON-LD for search engines and AI crawlers.
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function UrlEncoderStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.url-encoder');

  const toolUrl = absoluteToolUrl(locale, 'url-encoder');
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
