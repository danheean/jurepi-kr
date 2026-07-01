'use client';

import { useTranslations } from 'next-intl';

export function LadderUseCases() {
  const t = useTranslations('tools.ladder');

  const useCasesData = t.raw('useCases.items') as Array<{
    title: string;
    body: string;
  }>;

  return (
    <section className="my-12 space-y-8">
      <div className="space-y-4">
        <h2 className="font-display text-headline text-text">
          {t('useCases.heading')}
        </h2>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          {t('useCases.lead')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {useCasesData.map((useCase, idx) => (
          <article
            key={idx}
            className="border border-hairline rounded-lg p-5 hover:shadow-card transition-shadow"
          >
            <h3 className="text-card-title text-text mb-3">
              {useCase.title}
            </h3>
            <p className="text-body text-text-secondary leading-relaxed">
              {useCase.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
