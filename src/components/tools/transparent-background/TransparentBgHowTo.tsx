import { useTranslations } from 'next-intl';

/**
 * SSR-safe long-form guide (answer-first). Uses `useTranslations` so it
 * server-renders into the static HTML for search + AI-engine discoverability.
 * "What is this tool?" leads as always-visible prose, then the step-by-step
 * how-to, when to use it, and tips.
 */
export function TransparentBgHowTo() {
  const t = useTranslations('tools.transparent-background');

  const steps = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

  return (
    <section
      aria-labelledby="transparent-bg-howto-heading"
      className="space-y-8 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="transparent-bg-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      {/* What is this tool? — always-visible overview */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.whatIsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.whatIsBody')}</p>
      </article>

      {/* Step-by-step guide */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-text">{t('howTo.stepsTitle')}</h3>
        {steps.map((key, idx) => (
          <div key={key} className="space-y-2">
            <h4 className="font-semibold text-text">
              {idx + 1}. {t(`howTo.${key}`)}
            </h4>
            <p className="text-text-secondary leading-relaxed">{t(`howTo.${key}Body`)}</p>
          </div>
        ))}
      </div>

      {/* When to use it */}
      <div className="space-y-3 p-4 rounded-lg bg-surface-muted border border-hairline">
        <h3 className="text-xl font-semibold text-text">{t('howTo.useCasesTitle')}</h3>
        <p className="text-text-secondary leading-relaxed italic">{t('howTo.whenToUse')}</p>
      </div>

      {/* Tips */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.tipsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.tipsBody')}</p>
      </article>
    </section>
  );
}
