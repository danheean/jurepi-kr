'use client';

import { useLocale } from 'next-intl';
import type { MergedRanking } from '@/lib/rankings/schema';
import {
  softwareApplicationJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  absoluteToolUrl,
} from '@/lib/seo';

interface RankingsStructuredDataProps {
  catalog: MergedRanking[];
}

export function RankingsStructuredData({ catalog }: RankingsStructuredDataProps) {
  const locale = useLocale() as 'ko' | 'en';

  // SoftwareApplication LD+JSON
  const appJsonLd = softwareApplicationJsonLd({
    name: locale === 'ko' ? '별별 랭킹' : 'Various Rankings',
    description:
      locale === 'ko'
        ? '영화, 음식, 여행, 게임 등 다양한 분야의 신뢰할 수 있는 순위 목록'
        : 'Curated ranked lists across movies, restaurants, travel, games, and more',
    url: absoluteToolUrl(locale, 'rankings'),
  });

  // FAQPage LD+JSON
  const faqJsonLd = faqPageJsonLd([
    {
      q: locale === 'ko'
        ? '순위는 실시간으로 업데이트되나요?'
        : 'Are rankings updated in real-time?',
      a: locale === 'ko'
        ? '아니요, 각 순위는 정기적으로 검토되어 업데이트됩니다.'
        : 'No, rankings are reviewed and updated periodically.',
    },
  ]);

  // ItemList LD+JSON for each ranking
  const itemListJsonLds = catalog.map((ranking) => {
    const localeData = locale === 'ko' ? ranking.ko : ranking.en;
    return itemListJsonLd({
      name: localeData.title,
      url: absoluteToolUrl(locale, 'rankings'),
      items: localeData.items.map((item) => ({
        position: item.rank,
        name: item.name,
        description: item.description,
        url: item.link,
      })),
    });
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        suppressHydrationWarning
      />
      {itemListJsonLds.map((jsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
      ))}
    </>
  );
}
