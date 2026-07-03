import { useTranslations } from 'next-intl';

/**
 * SSR-safe FAQ section (visible prose). Questions/answers land in the static
 * prerendered HTML (crawlable by search + AI answer engines). The FAQPage
 * JSON-LD is emitted once by QRCodeStructuredData (single owner) to avoid
 * duplicate structured data.
 */
export function QRCodeFaq() {
  const t = useTranslations('tools.qr-code');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;

  return (
    <section
      aria-labelledby="qr-code-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="qr-code-faq-heading"
        className="font-display text-3xl font-bold text-text"
      >
        FAQ
      </h2>
      <div className="space-y-6">
        {faqItems.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-lg font-semibold text-text">{item.q}</h3>
            <p className="text-text-secondary leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
