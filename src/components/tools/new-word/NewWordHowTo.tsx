import { useTranslations } from 'next-intl';

/**
 * NewWord how-to section (SEO long-form).
 * Answer-first section explaining the tool and how to use it.
 * Server-renderable; no mounted gate.
 */
export function NewWordHowTo() {
  const t = useTranslations('tools.new-word');

  return (
    <section
      className="space-y-8 py-12 border-t border-hairline"
      aria-labelledby="new-word-howto-heading"
    >
      <h2 id="new-word-howto-heading" className="font-display font-bold text-headline text-text">
        {t('howTo.title')}
      </h2>

      {/* Overview — always visible */}
      <p className="text-body text-text-secondary leading-relaxed">{t('howTo.body')}</p>

      {/* When to use it */}
      <article className="space-y-3">
        <h3 className="text-lg font-semibold text-text">{t('howTo.useCasesTitle')}</h3>
        <p className="text-body text-text-secondary leading-relaxed">{t('howTo.useCasesBody')}</p>
      </article>

      {/* Tips */}
      <article className="space-y-3">
        <h3 className="text-lg font-semibold text-text">{t('howTo.tipsTitle')}</h3>
        <p className="text-body text-text-secondary leading-relaxed">{t('howTo.tipsBody')}</p>
      </article>
    </section>
  );
}
