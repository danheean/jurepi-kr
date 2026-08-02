import { useTranslations } from 'next-intl';

/** SSR long-form guide (gate-outside for search/AI discoverability). */
export function BirthdaySecretHowTo() {
  const t = useTranslations('tools.birthday-secret');
  const steps = (t.raw('howTo.steps') || []) as Array<{ title: string; body: string }>;

  return (
    <section
      aria-labelledby="bs-howto-heading"
      className="my-12 space-y-6 border-t border-hairline pt-8"
    >
      <h2 id="bs-howto-heading" className="font-display text-3xl font-bold text-text">
        {t('howTo.title')}
      </h2>
      <p className="text-text-secondary leading-relaxed">{t('howTo.lead')}</p>
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <article key={idx} className="space-y-2">
            <h3 className="text-xl font-semibold text-text">{step.title}</h3>
            <p className="text-text-secondary leading-relaxed">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
