import { useTranslations } from 'next-intl';

/**
 * SSR-safe intro section (eyebrow, heading, lead).
 * Uses the isomorphic `useTranslations` so it server-renders into the static HTML.
 * No "use client" — must be crawlable in the prerendered HTML.
 */
export function FindReplaceIntro() {
  const t = useTranslations('tools.find-replace');

  return (
    <div className="space-y-2 mb-6">
      <div className="text-xs font-semibold text-accent-grape uppercase tracking-wide">
        {t('intro.eyebrow')}
      </div>
      <h1 className="text-3xl font-bold text-text">{t('intro.heading')}</h1>
      <p className="text-base text-text-secondary leading-relaxed max-w-2xl">
        {t('intro.lead')}
      </p>
    </div>
  );
}
