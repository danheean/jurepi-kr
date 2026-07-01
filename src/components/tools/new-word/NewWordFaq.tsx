'use client';

import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

interface FaqItem {
  q: string;
  a: string;
}

/**
 * NewWord FAQ section with FAQPage JSON-LD.
 * Renders Q&A pairs and injects structured data.
 * Server-renderable (useTranslations SSRs fine; client-only for JSON-LD injection).
 */
export function NewWordFaq() {
  const t = useTranslations('tools.new-word');
  const faqData = t.raw('faq');

  // faqData structure: { title, items: [{ q, a }, ...] }
  const items = (faqData?.items ?? []) as FaqItem[];

  const jsonLd = faqPageJsonLd(items);

  return (
    <section
      className="space-y-6 py-12 border-t border-hairline"
      aria-labelledby="new-word-faq-heading"
    >
      <h2 id="new-word-faq-heading" className="font-display font-bold text-headline text-text">
        {faqData?.title}
      </h2>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <details
            key={idx}
            className="group border border-hairline rounded-lg p-4 open:bg-surface-muted transition-colors"
          >
            <summary className="cursor-pointer font-semibold text-text leading-relaxed">
              {item.q}
            </summary>
            <p className="mt-3 text-body text-text-secondary leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      {/* Inject FAQPage JSON-LD unconditionally (no hydration gate) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
