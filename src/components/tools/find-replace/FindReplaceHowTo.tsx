import { useTranslations } from 'next-intl';

/**
 * SSR-safe how-to section (title + numbered steps + tips).
 * Consumes t.raw('howTo.steps') (string[]) and t.raw('howTo.tips') (Array<{title,body}>).
 * Uses the isomorphic `useTranslations` so it server-renders into the static HTML.
 */
export function FindReplaceHowTo() {
  const t = useTranslations('tools.find-replace');

  const steps = (t.raw('howTo.steps') || []) as string[];
  const tips = (t.raw('howTo.tips') || []) as Array<{ title: string; body: string }>;

  return (
    <section
      aria-labelledby="find-replace-howto-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2 id="find-replace-howto-heading" className="font-display text-3xl font-bold text-text">
        {t('howTo.title')}
      </h2>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand text-on-brand flex items-center justify-center font-bold text-sm">
              {idx + 1}
            </div>
            <p className="text-text-secondary leading-relaxed flex items-center">{step}</p>
          </div>
        ))}
      </div>

      {/* Tips — each card carries its own title, so no separate section heading is needed */}
      {tips.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="bg-surface-muted rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-text text-sm">{tip.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
