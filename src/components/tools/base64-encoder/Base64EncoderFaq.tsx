import { useTranslations } from 'next-intl';

/**
 * Base64EncoderFaq: FAQ section with JSON-LD FAQPage schema.
 * Rendered server-side outside of mounted gate.
 * Single owner of FAQPage JSON-LD (not duplicated in StructuredData).
 */
export function Base64EncoderFaq() {
  const t = useTranslations('tools.base64-encoder');

  const faqItems = t.raw('faq.items') as Array<{ q: string; a: string }>;

  return (
    <section className="space-y-6 py-12">
      <h2 className="text-2xl font-bold text-text">{t('faq.heading')}</h2>

      <div className="space-y-3">
        {faqItems.map((item) => (
          <details key={item.q} className="group border border-hairline rounded-lg p-4 cursor-pointer">
            <summary className="font-semibold text-text group-open:text-brand">
              {item.q}
            </summary>
            <p className="mt-3 text-text-secondary">{item.a}</p>
          </details>
        ))}
      </div>

      {/* JSON-LD FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
          }),
        }}
      />
    </section>
  );
}
