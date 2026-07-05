import { useTranslations } from 'next-intl'

export function KnittingGaugeIntro() {
  const t = useTranslations('tools.knitting-gauge')

  return (
    <section className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent-sun-ink">
        {t('eyebrow')}
      </p>
      <h1 className="text-4xl font-bold text-text">{t('title')}</h1>
      <p className="text-lg text-text-secondary">{t('lead')}</p>
    </section>
  )
}
