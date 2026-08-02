import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  absoluteEntityUrl,
  absoluteToolUrl,
  buildToolEntityMetadata,
  breadcrumbListJsonLd,
} from '@/lib/seo';
import { ShareButtons } from '@/components/share';
import generated from '@/components/tools/birthday-secret/data/birthday-secret.generated.json';
import type { BirthdayCatalog, Locale } from '@/lib/birthday-secret/schema';
import { MONTH_SLUGS } from '@/lib/birthday-secret/schema';
import { monthBySlug, stoneByMonth, flowerByDay } from '@/lib/birthday-secret/catalog';
import { monthNumber, pad2 } from '@/lib/birthday-secret/date';
import { MonthSpoke } from '@/components/tools/birthday-secret/MonthSpoke';

const catalog = generated as unknown as BirthdayCatalog;

type Props = { params: Promise<{ locale: string; month: string }> };

export function generateStaticParams() {
  const params: Array<{ locale: string; month: string }> = [];
  MONTH_SLUGS.forEach((month) => {
    params.push({ locale: 'ko', month });
    params.push({ locale: 'en', month });
  });
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, month } = await params;
  const record = monthBySlug(catalog, month);
  if (!record) return {};
  const loc = locale as Locale;
  const stone = stoneByMonth(catalog, record.month);
  const title = record[loc].title;
  const description = stone
    ? `${record[loc].title} · ${stone[loc].name} · ${stone[loc].meaning}`
    : record[loc].title;
  return buildToolEntityMetadata({
    locale,
    toolSlug: 'birthday-secret',
    entitySlug: month,
    title,
    description,
  });
}

export default async function MonthPage({ params }: Props) {
  const { locale, month } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const record = monthBySlug(catalog, month);
  const stone = record ? stoneByMonth(catalog, record.month) : null;
  if (!record || !stone) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'tools.birthday-secret' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
  const entityUrl = absoluteEntityUrl(locale, 'birthday-secret', month);

  const mn = record.month;
  const flowerSamples = [1, 8, 15, 22]
    .map((d) => flowerByDay(catalog, `${pad2(mn)}-${pad2(d)}`))
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const idx = MONTH_SLUGS.indexOf(month as (typeof MONTH_SLUGS)[number]);
  const prevSlug = MONTH_SLUGS[(idx + 11) % 12];
  const nextSlug = MONTH_SLUGS[(idx + 1) % 12];

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: record[loc].title,
    description: `${stone[loc].name} · ${stone[loc].meaning}`,
    url: entityUrl,
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    isPartOf: absoluteToolUrl(locale, 'birthday-secret'),
  };
  const breadcrumbLd = breadcrumbListJsonLd([
    { name: locale === 'ko' ? '홈' : 'Home', url: `${siteUrl}/${locale}` },
    { name: t('spoke.toolName'), url: absoluteToolUrl(locale, 'birthday-secret') },
    { name: record[loc].title, url: entityUrl },
  ]);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-container px-6 py-16">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <a href={absoluteToolUrl(locale, 'birthday-secret')} className="text-brand-ink hover:underline">
            ← {t('spoke.toolName')}
          </a>
          <ShareButtons url={entityUrl} title={record[loc].title} />
        </div>

        <MonthSpoke
          month={record}
          stone={stone}
          flowerSamples={flowerSamples}
          prevSlug={prevSlug}
          nextSlug={nextSlug}
        />
      </div>
    </div>
  );
}
