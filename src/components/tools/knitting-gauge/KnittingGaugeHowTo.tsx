import { useTranslations } from 'next-intl'

/**
 * KnittingGaugeHowTo: long-form reference article (server-render, gate outside
 * mounted) so the guide is in the static HTML for search + AI-engine discovery.
 * "What is gauge?" leads as always-visible prose; then how-to, use cases, tips.
 */
export function KnittingGaugeHowTo() {
  const t = useTranslations('tools.knitting-gauge')

  const sections = [
    { title: t('howTo.whatIsTitle'), body: t('howTo.whatIsBody') },
    { title: t('howTo.howToTitle'), body: t('howTo.howToBody') },
    { title: t('howTo.useCasesTitle'), body: t('howTo.useCasesBody') },
    { title: t('howTo.tipsTitle'), body: t('howTo.tipsBody') },
  ]

  return (
    <section className="space-y-8" aria-labelledby="knitting-gauge-howto-heading">
      <h2 id="knitting-gauge-howto-heading" className="text-2xl font-bold text-text">
        {t('howTo.title')}
      </h2>
      <div className="space-y-8">
        {sections.map((section) => (
          <article key={section.title} className="space-y-3">
            <h3 className="text-lg font-semibold text-text">{section.title}</h3>
            <p className="leading-relaxed text-text-secondary">{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
