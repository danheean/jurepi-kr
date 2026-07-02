import { useTranslations } from 'next-intl';

export function RankingsFaq() {
  const t = useTranslations('tools.rankings.faq');
  const items = t.raw('items') as Array<{ q: string; a: string }>;

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-text">{t('heading')}</h2>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <details key={idx} className="group rounded-lg border border-hairline p-4 cursor-pointer">
            <summary className="font-semibold text-text list-none select-none">
              <span className="group-open:hidden">{item.q}</span>
              <span className="hidden group-open:inline">{item.q}</span>
            </summary>
            <p className="mt-3 text-text-secondary leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
