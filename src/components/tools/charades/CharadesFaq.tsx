import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

/**
 * SSR-safe FAQ section — single owner of FAQPage JSON-LD (per platform
 * convention: Faq owns FAQPage, StructuredData owns SoftwareApplication only).
 * Uses `useTranslations` so questions/answers/JSON-LD all land in the static
 * prerendered HTML for search + AI answer engines.
 */
export function CharadesFaq() {
  const t = useTranslations('tools.charades');

  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section aria-labelledby="charades-faq-heading" className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <h2 id="charades-faq-heading" className="font-display text-3xl font-bold text-text">
        {t('faq.title')}
      </h2>
      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details key={idx} className="border border-hairline rounded-lg p-4 hover:bg-surface-muted transition">
            <summary className="font-semibold text-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded">
              {item.q}
            </summary>
            <p className="mt-3 text-text-secondary leading-relaxed whitespace-pre-wrap">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
