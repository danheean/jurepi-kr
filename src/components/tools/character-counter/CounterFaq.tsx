'use client';

import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

/**
 * SSR-safe FAQ section (visible prose) + FAQPage JSON-LD.
 * This component OWNS the FAQPage JSON-LD (only place it's emitted).
 * Questions/answers and structured data land in the static prerendered HTML.
 * Can be "use client" because we use the isomorphic useTranslations.
 */
export function CounterFaq() {
  const t = useTranslations('tools.character-counter');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section
      aria-labelledby="counter-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2
        id="counter-faq-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('faq.title')}
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
