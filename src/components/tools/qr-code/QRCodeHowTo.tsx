import { useTranslations } from 'next-intl';

/**
 * SSR-safe long-form guide. Uses `useTranslations` so it server-renders into
 * the static HTML for search + AI-engine discoverability.
 */
export function QRCodeHowTo() {
  const t = useTranslations('tools.qr-code');

  const content = t('howTo.content');

  // Split by double newline to get paragraphs
  const paragraphs = content.split('\n\n').filter(Boolean);

  return (
    <section
      aria-labelledby="qr-code-howto-heading"
      className="space-y-6 mt-12 mb-8 border-t border-hairline pt-8"
    >
      <h2
        id="qr-code-howto-heading"
        className="font-display text-3xl font-bold text-text"
      >
        {t('howTo.title')}
      </h2>

      <div className="space-y-4">
        {paragraphs.map((para, idx) => (
          <p
            key={idx}
            className="text-text-secondary leading-relaxed whitespace-pre-wrap"
          >
            {para}
          </p>
        ))}
      </div>
    </section>
  );
}
