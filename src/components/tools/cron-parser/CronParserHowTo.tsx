import { useTranslations } from 'next-intl';

/**
 * SSR-safe long-form guide (answer-first). Uses `useTranslations` so it
 * server-renders into the static HTML for search + AI-engine discoverability.
 */
export function CronParserHowTo() {
  const t = useTranslations('tools.cron-parser');

  const howToItems = (t.raw('howTo.items') || []) as Array<{
    title: string;
    body: string;
  }>;

  return (
    <section
      aria-labelledby="cron-parser-howto-heading"
      className="space-y-8 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="cron-parser-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      <div className="space-y-6">
        {howToItems.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="font-semibold text-text">{item.title}</h3>
            <p className="text-text-secondary leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
