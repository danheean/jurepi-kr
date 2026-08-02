import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';

/** SoftwareApplication JSON-LD. FAQPage is owned by BirthdaySecretFaq. Gate-outside SSR. */
export function BirthdaySecretStructuredData() {
  const locale = useLocale();
  const t = useTranslations('tools.birthday-secret');

  const schema = softwareApplicationJsonLd({
    name: t('title'),
    description: t('description'),
    url: absoluteToolUrl(locale, 'birthday-secret'),
  });

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
