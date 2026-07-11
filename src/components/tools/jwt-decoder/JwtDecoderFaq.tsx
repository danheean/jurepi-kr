import { useTranslations } from 'next-intl';

/**
 * SSR-safe FAQ + FAQPage JSON-LD (SINGLE owner of FAQPage for jwt-decoder).
 * Uses `useTranslations` so the questions, answers, and structured data all
 * land in the static prerendered HTML (crawlable by search + AI answer engines).
 * SoftwareApplication JSON-LD is emitted separately by JwtDecoderStructuredData.
 *
 * **CRITICAL:** This component OWNS FAQPage JSON-LD. No other component should
 * emit FAQPage for this tool.
 */
export function JwtDecoderFaq() {
  const t = useTranslations('tools.jwt-decoder');

  // Fetch visible FAQ items. Each has {q, a} where a is refined prose (no raw markdown).
  const rawItems = t.raw('faq.items');
  const faqItems = (Array.isArray(rawItems) ? rawItems : []) as Array<{ q: string; a: string }>;

  // Build FAQPage JSON-LD from the SAME visible items.
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
      aria-labelledby="jwt-decoder-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      {/* JSON-LD schema inline in HTML for prerender crawlability */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 id="jwt-decoder-faq-heading" className="font-display text-3xl font-bold text-text">
        {t('faq.title')}
      </h2>

      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="border border-hairline rounded-lg p-4 hover:bg-surface-muted transition"
          >
            <summary className="font-semibold text-text cursor-pointer">
              {item.q}
            </summary>
            <p className="mt-3 text-text-secondary leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
