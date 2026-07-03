import { useTranslations } from 'next-intl';

/**
 * SSR-safe intro (H1 + lead). Uses the isomorphic `useTranslations` so it
 * server-renders into the static HTML (crawlable by search + AI engines).
 */
export function QRCodeIntro() {
  const t = useTranslations('tools.qr-code');

  return (
    <header className="space-y-4 mb-8">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-text leading-tight">
        {t('intro.headline')}
      </h1>
      <p className="text-lg text-text-secondary leading-relaxed">
        {t('intro.lead')}
      </p>
    </header>
  );
}
