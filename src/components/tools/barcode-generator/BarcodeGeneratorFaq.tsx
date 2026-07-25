'use client';

import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

export function BarcodeGeneratorFaq() {
  const t = useTranslations('tools.barcode-generator');

  // next-intl has no bracket-index path syntax (`items[0].q`) — pull the whole
  // array out with t.raw() and index into it in JS instead.
  const rawItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqItems = rawItems.map((item) => ({
    question: item.q,
    answer: item.a,
  }));

  // Generate JSON-LD
  const structuredData = faqPageJsonLd(
    faqItems.map((item) => ({
      q: item.question,
      a: item.answer,
    }))
  );

  return (
    <>
      {/* JSON-LD (single owner of FAQPage) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Visible FAQ */}
      <div className="space-y-8 bg-surface-muted rounded-lg border border-hairline p-6">
        <h2 className="text-2xl font-bold text-brand-ink">{t('faq.title')}</h2>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <details
              key={idx}
              className="group border border-hairline rounded-md p-4 bg-surface"
              data-testid={`faq-item-${idx}`}
            >
              <summary className="cursor-pointer font-semibold text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring rounded">
                {item.question}
              </summary>
              <p className="mt-3 text-text-secondary leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
