import { useTranslations } from 'next-intl';

/**
 * NewWord how-to section (SEO long-form).
 * Answer-first section explaining the tool and how to use it.
 * Server-renderable; no mounted gate.
 */
export function NewWordHowTo() {
  const t = useTranslations('tools.new-word');
  const body = t('howTo.body');

  return (
    <section
      className="space-y-6 py-12 border-t border-hairline"
      aria-labelledby="new-word-howto-heading"
    >
      <h2 id="new-word-howto-heading" className="font-display font-bold text-headline text-text">
        {t('howTo.title')}
      </h2>

      <div className="prose prose-sm max-w-none text-body text-text-secondary leading-relaxed">
        <p>{body}</p>
      </div>
    </section>
  );
}
