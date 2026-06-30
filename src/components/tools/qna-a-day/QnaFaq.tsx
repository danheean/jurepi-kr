import { useTranslations } from 'next-intl';
import { faqPageJsonLd } from '@/lib/seo';

export function QnaFaq() {
  const t = useTranslations('tools.qna-a-day');

  // Map i18n FAQ items to schema
  const faqItems = Array.from({ length: 7 }, (_, i) => ({
    q: t(`faq.items.${i}.q`),
    a: t(`faq.items.${i}.a`),
  }));

  const faqSchema = faqPageJsonLd(faqItems);

  return (
    <section className="space-y-6 py-12 border-t border-hairline">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 className="text-body-lg font-semibold text-text">
        {t('faq.heading')}
      </h2>

      <div className="space-y-4">
        {faqItems.map((item, idx) => (
          <details key={idx} className="group">
            <summary className="flex items-center gap-2 cursor-pointer font-medium text-body text-text hover:text-accent-grape transition-colors">
              <span className="inline-block w-4 h-4 text-accent-grape group-open:rotate-90 transition-transform">
                ▶
              </span>
              {item.q}
            </summary>
            <p className="mt-3 ml-6 text-body text-text-secondary leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
