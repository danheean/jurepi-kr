import { useLocale, useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

export function HowtoFaq() {
  const t = useTranslations('tools.howto');
  const locale = useLocale();
  const items: Array<{ q: string; a: string }> = t.raw('faq.items') || [];

  // Generate FAQPage JSON-LD
  const faqs = items.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs,
  };

  return (
    <>
      <div className="max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-text">{t('faq.title')}</h2>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <details key={idx} className="border border-hairline rounded-lg p-4">
              <summary className="cursor-pointer font-bold text-text hover:text-brand">
                {item.q}
              </summary>
              <p className="mt-2 text-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
