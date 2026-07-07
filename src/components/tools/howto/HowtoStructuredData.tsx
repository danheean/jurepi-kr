import { useLocale } from 'next-intl';
import type { MergedGuide } from '@/lib/howto/schema';
import { absoluteToolUrl } from '@/lib/seo';

interface HowtoStructuredDataProps {
  catalog: MergedGuide[];
}

export function HowtoStructuredData({ catalog }: HowtoStructuredDataProps) {
  const locale = useLocale();

  // SoftwareApplication JSON-LD
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: locale === 'ko' ? '하우투 가이드' : 'How-To Guides',
    description: locale === 'ko' 
      ? '클로드 코드 설치, 토큰 발급 같은 실전 가이드를 이미지·다이어그램·코드와 함께 단계별로 안내합니다.'
      : 'Step-by-step guides — installing Claude Code, issuing API tokens — with images, diagrams, and code.',
    url: absoluteToolUrl(locale, 'howto'),
    applicationCategory: 'Utility',
  };

  // ItemList JSON-LD
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: catalog.map((guide, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: guide[locale as 'ko' | 'en'].title,
      url: `${absoluteToolUrl(locale, 'howto')}/${guide.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
