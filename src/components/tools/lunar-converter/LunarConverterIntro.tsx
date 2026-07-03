import { useTranslations, useLocale } from 'next-intl';

/**
 * SSR-safe intro (H1 + lead). Uses the isomorphic `useTranslations` so it
 * server-renders into the static HTML (crawlable by search + AI engines).
 */
export function LunarConverterIntro() {
  const t = useTranslations('tools.lunar-converter');
  const locale = useLocale();

  return (
    <header className="space-y-4 mb-8">
      <p className="text-xs font-bold tracking-wider text-brand uppercase">
        {t('intro.eyebrow')}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('intro.title')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">{t('intro.lead')}</p>
    </header>
  );
}
