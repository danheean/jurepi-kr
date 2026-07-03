import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

/**
 * FAQ section with FAQPage JSON-LD.
 * Uses i18n for all visible content (stored in tools.restaurant-map.faq.items).
 * Single owner of FAQPage JSON-LD across the tool (StructuredData handles SoftwareApplication/Restaurant/ItemList).
 * Rendered outside mounted gate for full prerender in static HTML (SEO crawlable).
 */
export function RestaurantMapFaq() {
  const t = useTranslations('tools.restaurant-map');

  // Load FAQ items from i18n (structure: faq.items[].q, faq.items[].a)
  const faqItems = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section
      aria-labelledby="restaurant-map-faq-heading"
      className="space-y-6 border-t border-hairline pt-8 mb-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2
        id="restaurant-map-faq-heading"
        className="text-3xl font-bold text-text"
      >
        {t('faq.heading')}
      </h2>
      <div className="space-y-3">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-lg border border-hairline bg-surface p-4 hover:bg-surface-muted transition"
          >
            <summary className="cursor-pointer font-semibold text-text group-open:text-brand">
              {item.q}
            </summary>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
