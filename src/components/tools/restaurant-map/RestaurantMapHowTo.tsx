import { useTranslations } from 'next-intl';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;

export function RestaurantMapHowTo() {
  const t = useTranslations('tools.restaurant-map.howTo');

  return (
    <section className="space-y-6 bg-surface-muted px-4 py-12">
      <div className="max-w-3xl space-y-8">
        <h2 className="text-2xl font-bold text-text">{t('title')}</h2>

        {/* What is this tool? — always-visible overview */}
        <article className="space-y-3">
          <h3 className="text-lg font-semibold text-text">{t('whatIsTitle')}</h3>
          <p className="text-text-secondary leading-relaxed">{t('whatIsBody')}</p>
        </article>

        {/* Steps */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-text">{t('stepsTitle')}</h3>
          <ol className="space-y-3 text-text-secondary leading-relaxed">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="flex gap-3">
                <span className="shrink-0 font-semibold text-brand-ink">{index + 1}.</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* When to use it */}
        <article className="space-y-3">
          <h3 className="text-lg font-semibold text-text">{t('useCasesTitle')}</h3>
          <p className="text-text-secondary leading-relaxed">{t('useCasesBody')}</p>
        </article>

        {/* Tips */}
        <article className="space-y-3">
          <h3 className="text-lg font-semibold text-text">{t('tipsTitle')}</h3>
          <p className="text-text-secondary leading-relaxed">{t('tipsBody')}</p>
        </article>
      </div>
    </section>
  );
}
