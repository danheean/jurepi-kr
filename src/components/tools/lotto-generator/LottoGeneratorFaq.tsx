'use client';

import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';
import { Markdown } from '@/components/markdown';

export function LottoGeneratorFaq() {
  const t = useTranslations('tools.lotto-generator');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section
      aria-labelledby="lotto-generator-faq-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2
        id="lotto-generator-faq-heading"
        className="font-display text-3xl font-bold text-text"
      >
        FAQ
      </h2>

      <div className="space-y-6">
        {faqItems.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-lg font-semibold text-text">{item.q}</h3>
            <div className="text-text-secondary leading-relaxed">
              <Markdown>{item.a}</Markdown>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
