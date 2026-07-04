'use client';

import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

export function RouletteFaq() {
  const t = useTranslations('tools.roulette');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section
      aria-labelledby="roulette-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2
        id="roulette-faq-heading"
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
