import { useTranslations } from 'next-intl';

export function QnaExamples() {
  const t = useTranslations('tools.qna-a-day');

  const examplesItems = t.raw('examples.items') as string[];

  return (
    <section className="space-y-6 py-12 border-t border-hairline">
      <h2 className="text-body-lg font-semibold text-text">
        {t('examples.heading')}
      </h2>

      <p className="text-body text-text-secondary leading-relaxed">
        {t('examples.lead')}
      </p>

      <div className="space-y-3">
        {examplesItems.map((question, idx) => (
          <div
            key={idx}
            className="p-4 border border-hairline rounded-lg hover:border-accent-grape hover:bg-accent-grape-soft/20 transition-all"
          >
            <p className="text-body text-text leading-relaxed">
              <span className="text-accent-grape mr-2">«</span>
              {question}
              <span className="text-accent-grape ml-2">»</span>
            </p>
          </div>
        ))}
      </div>

      <p className="text-caption text-text-muted">
        {t('examples.note')}
      </p>
    </section>
  );
}
