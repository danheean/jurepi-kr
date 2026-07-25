import { useTranslations } from 'next-intl';

/**
 * SSR-safe "How to play" guide (answer-first).
 * Uses `useTranslations` so it server-renders into the static HTML
 * for search and AI-engine discoverability.
 */
export function CharadesHowTo() {
  const t = useTranslations('tools.charades');

  const steps = (t.raw('howTo.steps') || []) as Array<{
    title: string;
    body: string;
  }>;

  return (
    <section aria-labelledby="charades-howto-heading" className="space-y-8 mt-12 mb-8 border-t border-hairline pt-8">
      <h2 id="charades-howto-heading" className="font-display text-3xl font-bold text-text">
        {t('howTo.title')}
      </h2>

      <p className="text-lg text-text-secondary leading-relaxed">{t('howTo.lead')}</p>

      <ol className="space-y-6 list-decimal list-inside">
        {steps.map((step, idx) => (
          <li key={idx} className="space-y-2">
            <h3 className="text-xl font-semibold text-text">{step.title}</h3>
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap ml-6">{step.body}</p>
          </li>
        ))}
      </ol>

      {/* When to use it */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.useCasesTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.useCasesBody')}</p>
      </article>

      {/* Tips */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.tipsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.tipsBody')}</p>
      </article>
    </section>
  );
}
