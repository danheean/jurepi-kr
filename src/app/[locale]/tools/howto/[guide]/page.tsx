import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { HowtoSpoke } from '@/components/tools/howto/HowtoSpoke';
import { byId } from '@/lib/howto/catalog';
import {
  absoluteToolUrl,
  absoluteEntityUrl,
  buildToolEntityMetadata,
  breadcrumbListJsonLd,
  techArticleJsonLd,
} from '@/lib/seo';
import guidesData from '@/components/tools/howto/data/guides.generated.json';
import type { MergedGuide } from '@/lib/howto/schema';

const CATALOG = guidesData as MergedGuide[];

type Props = {
  params: Promise<{ locale: 'ko' | 'en'; guide: string }>;
};

export function generateStaticParams() {
  return CATALOG.flatMap((guide) => [
    { locale: 'ko', guide: guide.slug },
    { locale: 'en', guide: guide.slug },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, guide: slug } = await params;
  const guide = byId(CATALOG, slug);

  if (!guide) {
    return {};
  }

  const content = guide[locale];
  return buildToolEntityMetadata({
    locale,
    toolSlug: 'howto',
    entitySlug: slug,
    title: content.title,
    description: content.summary,
  });
}

export default async function HowtoGuidePage({ params }: Props) {
  const { locale, guide: slug } = await params;
  setRequestLocale(locale);

  const guide = byId(CATALOG, slug);
  if (!guide) {
    notFound();
  }

  const content = guide[locale];
  const entityUrl = absoluteEntityUrl(locale, 'howto', slug);

  // TechArticle JSON-LD — url must equal the canonical (absoluteEntityUrl).
  const techArticle = techArticleJsonLd({
    headline: content.title,
    description: content.summary,
    url: entityUrl,
    datePublished: guide.updated,
    inLanguage: locale,
  });

  const breadcrumb = breadcrumbListJsonLd([
    { name: locale === 'ko' ? '홈' : 'Home', url: absoluteToolUrl(locale, '') },
    { name: locale === 'ko' ? '하우투 가이드' : 'How-To Guides', url: absoluteToolUrl(locale, 'howto') },
    { name: content.title, url: entityUrl },
  ]);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-container px-6 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticle) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
        <HowtoSpoke guide={guide} locale={locale} catalog={CATALOG} />
      </div>
    </div>
  );
}
