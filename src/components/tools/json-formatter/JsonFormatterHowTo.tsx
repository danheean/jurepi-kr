import { useTranslations } from 'next-intl';

export function JsonFormatterHowTo() {
  const t = useTranslations('tools.json-formatter');
  const items = t.raw('howTo.items') as Array<{ title: string; description: string }>;

  return (
    <section
      className="space-y-6 my-12 pb-8 border-b border-surface-muted"
      aria-labelledby="how-to-heading"
    >
      <h2 id="how-to-heading" className="text-2xl font-bold text-text">
        {t('howTo.title')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="font-semibold text-text">
              {item.title}
            </h3>
            <p className="text-text-secondary text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
