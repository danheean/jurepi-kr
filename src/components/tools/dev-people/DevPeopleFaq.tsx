import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * FAQ section + FAQPage JSON-LD (single owner — matches every other tool).
 * Rendered outside any mounted gate so the visible Q&A and the structured
 * data both land in the static prerendered HTML.
 */
export function DevPeopleFaq() {
  const t = useTranslations('tools.dev-people');
  const faqItems = (t.raw('faq.items') || []) as FaqItem[];

  const jsonLd = faqPageJsonLd(
    faqItems.map((item) => ({ q: item.question, a: item.answer }))
  );

  return (
    <section className="space-y-6" aria-labelledby="dev-people-faq-heading">
      <h2 id="dev-people-faq-heading" className="text-2xl font-bold text-text">
        {t('faqTitle')}
      </h2>
      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="group border border-hairline rounded-lg p-4 cursor-pointer hover:bg-surface-muted transition-colors"
            data-testid={`faq-item-${idx}`}
          >
            <summary className="font-semibold text-text cursor-pointer">
              {item.question}
            </summary>
            <div className="mt-3 text-text-secondary space-y-2">{item.answer}</div>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
