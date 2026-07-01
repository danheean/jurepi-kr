import { useTranslations } from 'next-intl';

export function QnaBenefits() {
  const t = useTranslations('tools.qna-a-day');

  const benefitsItems = t.raw('benefits.items') as Array<{
    title: string;
    body: string;
  }>;

  return (
    <section className="space-y-6 py-12 border-t border-hairline">
      <h2 className="text-body-lg font-semibold text-text">
        {t('benefits.heading')}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {benefitsItems.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg border border-hairline bg-surface-muted hover:shadow-card transition-shadow"
          >
            <h3 className="text-body font-semibold text-text mb-3">
              {item.title}
            </h3>
            <p className="text-body text-text-secondary leading-relaxed">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
