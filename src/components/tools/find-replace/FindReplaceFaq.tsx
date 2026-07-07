'use client';

import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

/**
 * SSR-safe FAQ section (visible prose) + FAQPage JSON-LD.
 * This component OWNS the FAQPage JSON-LD (only place it's emitted).
 * Questions/answers and structured data land in the static prerendered HTML.
 * Can be "use client" because we use the isomorphic useTranslations.
 */
export function FindReplaceFaq() {
  const t = useTranslations('tools.find-replace');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section
      aria-labelledby="find-replace-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2 id="find-replace-faq-heading" className="font-display text-3xl font-bold text-text">
        {t('faq.title')}
      </h2>
      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details key={idx} className="group">
            <summary className="cursor-pointer font-semibold text-text hover:text-accent-grape transition-colors select-none flex items-center gap-2">
              <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
                ▶
              </span>
              {item.q}
            </summary>
            <p className="mt-3 text-text-secondary text-sm leading-relaxed ml-6">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
