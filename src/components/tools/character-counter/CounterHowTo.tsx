import { useTranslations } from 'next-intl';

/**
 * SSR-safe how-to section with step-by-step guide.
 * No "use client" — this must be a server component for SEO crawlability.
 */
export function CounterHowTo() {
  const t = useTranslations('tools.character-counter');

  const steps = (t.raw('howTo.steps') || []) as Array<{ step: number; text: string }>;

  return (
    <section
      aria-labelledby="counter-howto-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="counter-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      <div className="space-y-4">
        {steps.map((item) => (
          <div key={item.step} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand text-on-brand flex items-center justify-center font-bold text-sm">
              {item.step}
            </div>
            <p className="text-text-secondary leading-relaxed flex items-center">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
