import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import bookmarksData from '@/components/tools/bookmarks/data/bookmarks.generated.json';
import {
  absoluteEntityUrl,
  buildToolEntityMetadata,
  breadcrumbListJsonLd,
  itemListJsonLd,
  absoluteToolUrl,
} from '@/lib/seo';
import { BookmarksSpoke } from '@/components/tools/bookmarks/BookmarksSpoke';

type Props = {
  params: Promise<{ locale: 'ko' | 'en'; topic: string }>;
};

export async function generateStaticParams() {
  const catalog = bookmarksData as MergedTopic[];
  const locales = ['ko', 'en'] as const;

  return catalog.flatMap((topic) =>
    locales.map((locale) => ({
      locale,
      topic: topic.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, topic } = await params;
  const catalog = bookmarksData as MergedTopic[];
  const tp = catalog.find((t) => t.slug === topic);

  if (!tp) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'tools.bookmarks' });
  const title = `${tp[locale].title} ${t('spoke.metaTitleSuffix')}`;
  const description = tp[locale].description.slice(0, 155);

  return buildToolEntityMetadata({
    locale,
    toolSlug: 'bookmarks',
    entitySlug: topic,
    title,
    description,
  });
}

export default async function SpokeToolPage({ params }: Props) {
  const { locale, topic } = await params;
  setRequestLocale(locale);

  const catalog = bookmarksData as MergedTopic[];
  const tp = catalog.find((t) => t.slug === topic);

  if (!tp) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'tools.bookmarks' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

  // Build JSON-LD schemas
  const itemListLd = itemListJsonLd({
    name: tp[locale].title,
    url: absoluteEntityUrl(locale, 'bookmarks', topic),
    items: tp[locale].sections.flatMap((s) =>
      s.links.map((l, i) => ({
        position: i + 1,
        name: l.label,
        description: l.description ?? l.label,
        url: l.url,
      }))
    ),
  });

  const breadcrumbItems = [
    { name: t('spoke.breadcrumbHome'), url: `${siteUrl}/${locale}` },
    { name: t('intro.title'), url: absoluteToolUrl(locale, 'bookmarks') },
    { name: tp[locale].title, url: absoluteEntityUrl(locale, 'bookmarks', topic) },
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
        <BookmarksSpoke topic={tp} locale={locale as 'ko' | 'en'} />
      </div>
    </div>
  );
}
