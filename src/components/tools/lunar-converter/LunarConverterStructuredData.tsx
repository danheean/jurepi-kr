import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, breadcrumbListJsonLd, absoluteToolUrl } from '@/lib/seo';

/**
 * Lunar Converter structured data (JSON-LD) component.
 * Injects SoftwareApplication and BreadcrumbList JSON-LD for search engines and AI crawlers.
 * FAQPage JSON-LD is emitted by LunarConverterFaq (single source, matches age-calculator/url-encoder/speed-quiz convention).
 * Rendered at the route level (not wrapped in mounted gate) for full discoverability.
 */
export function LunarConverterStructuredData() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.lunar-converter');

  const toolUrl = absoluteToolUrl(locale, 'lunar-converter');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  // Breadcrumb: Home → Tools → Lunar Converter
  const siteUrl = new URL(toolUrl).origin;
  const breadcrumbs = breadcrumbListJsonLd([
    {
      name: locale === 'ko' ? '홈' : 'Home',
      url: `${siteUrl}/${locale}`,
    },
    {
      name: locale === 'ko' ? '도구' : 'Tools',
      url: `${siteUrl}/${locale}/tools`,
    },
    {
      name: title,
      url: toolUrl,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  );
}
