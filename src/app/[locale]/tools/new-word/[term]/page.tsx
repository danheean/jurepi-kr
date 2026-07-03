import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { byId } from '@/lib/new-word/catalog';
import termsData from '@/components/tools/new-word/data/terms.generated.json';
import { markdownToPlainText } from '@/lib/markdown/markdownToPlainText';
import {
  absoluteEntityUrl,
  buildToolEntityMetadata,
  definedTermJsonLd,
  breadcrumbListJsonLd,
  absoluteToolUrl,
} from '@/lib/seo';
import { NewWordSpoke } from '@/components/tools/new-word/NewWordSpoke';
import { ShareButtons } from '@/components/share';

type Props = {
  params: Promise<{ locale: 'ko' | 'en'; term: string }>;
};

export async function generateStaticParams() {
  const catalog = termsData as any[];
  const locales = ['ko', 'en'];

  return catalog.flatMap((term) =>
    locales.map((locale) => ({
      locale,
      term: term.slug,
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, term } = await params;
  const catalog = termsData as any[];
  const item = byId(catalog, term);

  if (!item) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'tools.new-word' });
  const name = item[locale].term;
  const title = `${name} ${t('spoke.metaTitleSuffix')}`;
  const description = markdownToPlainText(item[locale].definition).slice(0, 150);

  return buildToolEntityMetadata({
    locale,
    toolSlug: 'new-word',
    entitySlug: term,
    title,
    description,
  });
}

export default async function SpokeToolPage({ params }: Props) {
  const { locale, term } = await params;
  setRequestLocale(locale);

  const catalog = termsData as any[];
  const item = byId(catalog, term);

  if (!item) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'tools.new-word' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

  // Build JSON-LD schemas
  const definedTermLd = definedTermJsonLd({
    name: item[locale].term,
    description: markdownToPlainText(item[locale].definition),
    url: absoluteEntityUrl(locale, 'new-word', term),
    inDefinedTermSetUrl: absoluteToolUrl(locale, 'new-word'),
  });

  const breadcrumbItems = [
    { name: t('spoke.breadcrumbHome'), url: `${siteUrl}/${locale}` },
    { name: t('intro.title'), url: absoluteToolUrl(locale, 'new-word') },
    { name: item[locale].term, url: absoluteEntityUrl(locale, 'new-word', term) },
  ];
  const breadcrumbLd = breadcrumbListJsonLd(breadcrumbItems);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-container px-6 py-16">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* SNS share (shared template affordance across tool + spoke pages) */}
        <div className="mb-6 flex justify-end">
          <ShareButtons />
        </div>

        {/* Spoke Content */}
        <NewWordSpoke term={item} locale={locale as 'ko' | 'en'} catalog={catalog} />
      </div>
    </div>
  );
}
