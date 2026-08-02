import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

/** Visible FAQ + FAQPage JSON-LD (single owner). Gate-outside SSR. */
export function BirthdaySecretFaq() {
  const t = useTranslations('tools.birthday-secret');
  const items = (t.raw('faq.items') || []) as Array<{ q: string; a: string }>;
  const schema = faqPageJsonLd(items);

  return (
    <section
      aria-labelledby="bs-faq-heading"
      className="mb-8 mt-12 space-y-6 border-t border-hairline pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h2 id="bs-faq-heading" className="font-display text-3xl font-bold text-text">
        {t('faq.title')}
      </h2>
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-lg font-semibold text-text">{item.q}</h3>
            <p className="leading-relaxed text-text-secondary">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
