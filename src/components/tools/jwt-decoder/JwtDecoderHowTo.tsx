import { useTranslations } from 'next-intl';

/**
 * SEO HowTo section: "What is JWT and why decode it?"
 * Renders at route level (outside mounted gates) for prerendered crawlability.
 * Uses sync useTranslations to be SSR-safe (NOT async getTranslations).
 */
export function JwtDecoderHowTo() {
  const t = useTranslations('tools.jwt-decoder');

  // Fetch the howTo.items array. Each item has {q, a} where a is refined prose (no raw markdown).
  const items = (t.raw('howTo.items') || []) as Array<{ q: string; a: string }>;

  return (
    <section
      className="space-y-8 my-12 pb-8 border-b border-hairline"
      aria-labelledby="jwt-decoder-how-to-heading"
    >
      <h2 id="jwt-decoder-how-to-heading" className="font-display text-3xl font-bold text-text">
        {t('howTo.title')}
      </h2>

      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-lg font-semibold text-text">
              {item.q}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
