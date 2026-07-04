import { useTranslations } from 'next-intl';

/**
 * SSR-safe intro section (H1 + lead).
 * Uses the isomorphic `useTranslations` so it server-renders into the static HTML.
 * No "use client" — this must be a server component for SEO crawlability.
 */
export function CounterIntro() {
  const t = useTranslations('tools.character-counter');

  return (
    <header className="space-y-4 mb-8">
      <div className="text-xs uppercase tracking-wider font-semibold text-brand mb-2">
        {t('intro.eyebrow')}
      </div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('intro.heading')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">
        {t('intro.lead')}
      </p>
    </header>
  );
}
