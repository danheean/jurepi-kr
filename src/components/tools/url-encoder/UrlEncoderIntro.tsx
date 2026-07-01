import { useTranslations, useLocale } from 'next-intl';

/**
 * SSR-safe intro (H1 + lead). Uses the isomorphic `useTranslations` so it
 * server-renders into the static HTML (crawlable by search + AI engines).
 */
export function UrlEncoderIntro() {
  const t = useTranslations('tools.url-encoder');
  const locale = useLocale();

  return (
    <header className="space-y-4 mb-8">
      <p className="text-xs font-bold tracking-wider text-brand uppercase">
        {locale === 'ko' ? '개발 도구' : 'Developer Tool'}
      </p>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('title')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">{t('lead')}</p>
    </header>
  );
}
