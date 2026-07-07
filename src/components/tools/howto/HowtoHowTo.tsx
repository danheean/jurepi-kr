import { useTranslations } from 'next-intl';

export function HowtoHowTo() {
  const t = useTranslations('tools.howto');
  const items: Array<{ title: string; body: string }> = t.raw('howto.items') || [];

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-text">{t('howto.title')}</h2>
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="font-bold text-lg text-text">{item.title}</h3>
            <p className="text-text-secondary">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
