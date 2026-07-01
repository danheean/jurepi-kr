import { useTranslations } from 'next-intl';

/**
 * NewWord intro section (SEO-critical).
 * Renders eyebrow, H1, and lead copy.
 * Server-renderable; no mounted gate.
 */
export function NewWordIntro() {
  const t = useTranslations('tools.new-word');

  return (
    <section className="space-y-4 mb-12">
      <div className="text-xs font-semibold uppercase tracking-widest text-accent-mint-ink">
        {t('intro.eyebrow')}
      </div>

      <h1 className="font-display font-bold text-display-lg text-text">
        {t('intro.title')}
      </h1>

      <p className="text-body-lg text-text-secondary leading-relaxed">
        {t('intro.lead')}
      </p>
    </section>
  );
}
