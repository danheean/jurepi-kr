import { useTranslations } from 'next-intl';

/**
 * SSR-safe intro (H1 + lead). Uses the isomorphic `useTranslations` so it
 * server-renders into the static HTML (crawlable by search + AI engines).
 * No client hooks, no "use client" — this is a server component.
 */
export function TransparentBgIntro() {
  const t = useTranslations('tools.transparent-background');

  return (
    <header className="space-y-4 mb-8">
      <p className="text-xs font-bold tracking-wider text-accent-sky-ink uppercase">
        {t('intro.eyebrow')}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('intro.title')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">{t('intro.lead')}</p>
    </header>
  );
}
