'use client';

import { useTranslations } from 'next-intl';

export function RouletteIntro() {
  const t = useTranslations('tools.roulette');

  return (
    <section className="mb-8">
      <div className="text-sm font-semibold uppercase tracking-wide text-brand mb-2">
        {t('intro.eyebrow')}
      </div>
      <h1 className="font-display text-4xl font-bold text-text mb-4">
        {t('intro.headline')}
      </h1>
      <p className="text-lg text-text-secondary max-w-2xl">
        {t('intro.lead')}
      </p>
    </section>
  );
}
