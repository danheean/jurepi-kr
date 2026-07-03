import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { byId } from '@/lib/rankings/catalog';
import rankingsData from '@/components/tools/rankings/data/rankings.generated.json';
import {
  absoluteEntityUrl,
  buildToolEntityMetadata,
  breadcrumbListJsonLd,
  itemListJsonLd,
  absoluteToolUrl,
} from '@/lib/seo';
import { RankingsSpoke } from '@/components/tools/rankings/RankingsSpoke';

type Props = {
  params: Promise<{ locale: 'ko' | 'en'; ranking: string }>;
};

export async function generateStaticParams() {
  const catalog = rankingsData as any[];
  const locales = ['ko', 'en'] as const;

  return catalog.flatMap((ranking) =>
    locales.map((locale) => ({
      locale,
      ranking: ranking.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, ranking } = await params;
  const catalog = rankingsData as any[];
  const item = byId(catalog, ranking);

  if (!item) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'tools.rankings' });
  const title = `${item[locale].title} ${t('spoke.metaTitleSuffix')}`;
  const description = `${item[locale].title} 전체 순위. 출처: ${item[locale].sourceNote} (${t('spoke.asOfPrefix')} ${item.asOfDate}).`.slice(0, 155);

  return buildToolEntityMetadata({
    locale,
    toolSlug: 'rankings',
    entitySlug: ranking,
    title,
    description,
  });
}

export default async function SpokeToolPage({ params }: Props) {
  const { locale, ranking } = await params;
  setRequestLocale(locale);

  const catalog = rankingsData as any[];
  const item = byId(catalog, ranking);

  if (!item) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'tools.rankings' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

  // Build JSON-LD schemas
  const itemListLd = itemListJsonLd({
    name: item[locale].title,
    url: absoluteEntityUrl(locale, 'rankings', ranking),
    items: item[locale].items.map((i: any) => ({
      position: i.rank,
      name: i.name,
      description: i.description,
      url: i.link,
    })),
  });

  const breadcrumbItems = [
    { name: t('spoke.breadcrumbHome'), url: `${siteUrl}/${locale}` },
    { name: t('intro.title'), url: absoluteToolUrl(locale, 'rankings') },
    { name: item[locale].title, url: absoluteEntityUrl(locale, 'rankings', ranking) },
  ];
  const breadcrumbLd = breadcrumbListJsonLd(breadcrumbItems);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-container px-6 py-16">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* Spoke Content */}
        <RankingsSpoke ranking={item} locale={locale as 'ko' | 'en'} />
      </div>
    </div>
  );
}
