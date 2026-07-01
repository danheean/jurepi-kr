import { useTranslations } from 'next-intl';

/**
 * SSR-safe long-form guide (answer-first). Uses `useTranslations` so it
 * server-renders into the static HTML for search + AI-engine discoverability.
 */
export function UrlEncoderHowTo() {
  const t = useTranslations('tools.url-encoder');

  const sections = ['whatIs', 'componentVsUri', 'utf8VsEuckr'] as const;

  return (
    <section
      aria-labelledby="url-encoder-howto-heading"
      className="space-y-8 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="url-encoder-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.heading')}
      </h2>

      {sections.map((key) => (
        <div key={key} className="space-y-3">
          <h3 className="text-xl font-semibold text-text">{t(`howTo.${key}.title`)}</h3>
          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
            {t(`howTo.${key}.body`)}
          </p>
        </div>
      ))}
    </section>
  );
}
