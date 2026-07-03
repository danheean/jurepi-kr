import { useTranslations } from 'next-intl';

/**
 * SSR-safe FAQ + FAQPage JSON-LD. Uses `useTranslations` so the questions,
 * answers, and structured data all land in the static prerendered HTML
 * (crawlable by search + AI answer engines). SoftwareApplication/BreadcrumbList
 * JSON-LD is added separately at the route level.
 */
export function LunarConverterFaq() {
  const t = useTranslations('tools.lunar-converter');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <section
      aria-labelledby="lunar-converter-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2 id="lunar-converter-faq-heading" className="font-display text-3xl font-bold text-text">
        {t('faq.heading')}
      </h2>
      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="border border-hairline rounded-lg p-4 hover:bg-surface-muted transition"
          >
            <summary className="font-semibold text-text cursor-pointer">{item.q}</summary>
            <p className="mt-3 text-text-secondary leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
