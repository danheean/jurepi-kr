'use client';

import { useTranslations } from 'next-intl';

export function LadderHowTo() {
  const t = useTranslations('tools.ladder');

  return (
    <details data-testid="howto-details" className="my-12">
      <summary className="font-display text-headline text-text cursor-pointer">
        {t('howTo.heading')}
      </summary>

      <section className="mt-8 space-y-8">
        <article className="space-y-4">
          <h3 className="text-card-title text-text">
            {t('howTo.whatIsTitle')}
          </h3>
          <p className="font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
            {t('howTo.whatIsBody')}
          </p>
        </article>

        <article className="space-y-4">
          <h3 className="text-card-title text-text">
            {t('howTo.howToTitle')}
          </h3>
          <p className="font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
            {t('howTo.howToBody')}
          </p>
        </article>

        <article className="space-y-4">
          <h3 className="text-card-title text-text">
            {t('howTo.featuresTitle')}
          </h3>
          <p className="font-body text-text-secondary leading-relaxed whitespace-pre-wrap">
            {t('howTo.featuresBody')}
          </p>
        </article>
      </section>
    </details>
  );
}
