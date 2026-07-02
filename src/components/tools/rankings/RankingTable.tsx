import { useTranslations, useLocale } from 'next-intl';
import type { MergedRanking } from '@/lib/rankings/schema';
import { RankingRow } from './RankingRow';

interface RankingTableProps {
  ranking: MergedRanking;
}

export function RankingTable({ ranking }: RankingTableProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.rankings.detail.table');

  const items = locale === 'ko' ? ranking.ko.items : ranking.en.items;
  const title = locale === 'ko' ? ranking.ko.title : ranking.en.title;
  const caption = t('caption', { title, count: items.length });

  return (
    <div className="overflow-x-auto" role="region" aria-label={`${title} table`}>
      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-hairline">
            <th scope="col" className="px-3 py-2 text-left font-bold text-text">
              {t('rank')}
            </th>
            <th scope="col" className="px-3 py-2 text-left font-bold text-text">
              {t('name')}
            </th>
            <th scope="col" className="px-3 py-2 text-left font-bold text-text">
              {t('description')}
            </th>
            {items.some((item) => item.link) && (
              <th scope="col" className="px-3 py-2 text-left font-bold text-text">
                {t('link')}
              </th>
            )}
            {items.some((item) => item.imageUrl) && (
              <th scope="col" className="px-3 py-2 text-center font-bold text-text">
                Image
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <RankingRow
              key={`${ranking.slug}-${item.rank}`}
              item={item}
              ranking={ranking}
              showLink={items.some((i) => i.link)}
              showImage={items.some((i) => i.imageUrl)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
