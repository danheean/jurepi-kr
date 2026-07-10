import { useTranslations } from 'next-intl';

/**
 * SEO Intro section: H1 + lead paragraph.
 * Renders at route level (outside mounted gates) for prerendered crawlability.
 * No state, no client-side logic.
 */
export function JwtDecoderIntro() {
  const t = useTranslations('tools.jwt-decoder');

  return (
    <section className="space-y-4 mb-12">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent-sun/10">
          <span className="text-2xl">🔑</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          {t('eyebrow')}
        </p>
      </div>

      <h1 className="font-display text-4xl font-bold text-text">
        {t('title')}
      </h1>

      <p className="text-lg text-text-secondary leading-relaxed">
        {t('lead')}
      </p>
    </section>
  );
}
