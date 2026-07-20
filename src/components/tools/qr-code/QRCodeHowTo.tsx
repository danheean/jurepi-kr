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

      {/* What is this tool? — always-visible overview */}
      <article className="space-y-3">
        <h3 className="text-xl font-semibold text-text">{t('howTo.whatIsTitle')}</h3>
        <p className="text-text-secondary leading-relaxed">{t('howTo.whatIsBody')}</p>
      </article>

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
