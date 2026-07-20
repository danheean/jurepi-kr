import { useTranslations } from 'next-intl';

/**
 * SSR reference article (server component, gate outside mounted) so the guide is
 * in the static HTML for search + AI-engine discovery — and always visible (not
 * collapsed) so a reader/reviewer sees the content without a click.
 */
export function QnaHowTo() {
  const t = useTranslations('tools.qna-a-day');

  const sections = [
    { title: t('howTo.whatTitle'), body: t('howTo.whatBody') },
    { title: t('howTo.howTitle'), body: t('howTo.howBody') },
    { title: t('howTo.whyTitle'), body: t('howTo.whyBody') },
    { title: t('howTo.useCasesTitle'), body: t('howTo.useCasesBody') },
    { title: t('howTo.tipsTitle'), body: t('howTo.tipsBody') },
  ];

  return (
    <section
      className="space-y-8 py-12 border-t border-hairline"
      aria-labelledby="qna-howto-heading"
    >
      <h2 id="qna-howto-heading" className="font-display text-2xl font-bold text-text">
        {t('howTo.heading')}
      </h2>
      <div className="space-y-8 text-body text-text-secondary leading-relaxed">
        {sections.map((section) => (
          <article key={section.title} className="space-y-2">
            <h3 className="font-semibold text-text">{section.title}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
