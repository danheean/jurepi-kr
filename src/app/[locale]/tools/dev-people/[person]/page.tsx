import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  absoluteEntityUrl,
  absoluteToolUrl,
  buildToolEntityMetadata,
  personJsonLd,
  breadcrumbListJsonLd,
} from '@/lib/seo';
import devPeopleData from '@/components/tools/dev-people/data/dev-people.generated.json';
import { byId } from '@/lib/dev-people/catalog';
import type { MergedPerson } from '@/lib/dev-people/schema';
import { ShareButtons } from '@/components/share';
import { PersonSpoke } from '@/components/tools/dev-people/PersonSpoke';

type Props = {
  params: Promise<{ locale: string; person: string }>;
};

export async function generateStaticParams() {
  const params: Array<{ locale: string; person: string }> = [];
  (devPeopleData as { peoples: MergedPerson[] }).peoples.forEach((person) => {
    params.push({ locale: 'ko', person: person.slug });
    params.push({ locale: 'en', person: person.slug });
  });
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, person } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.dev-people' });

  const personRecord = byId((devPeopleData as { peoples: MergedPerson[] }).peoples, person);
  if (!personRecord) {
    return {};
  }

  const personName = locale === 'ko' ? personRecord.ko.name : personRecord.en.name;
  const personKnownFor = locale === 'ko' ? personRecord.ko.knownFor : personRecord.en.knownFor;

  return buildToolEntityMetadata({
    locale,
    toolSlug: 'dev-people',
    entitySlug: person,
    title: `${personName} · ${t('title')}`,
    description: personKnownFor.split('\n')[0].trim(),
  });
}

export default async function PersonPage({ params }: Props) {
  const { locale, person } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'tools.dev-people' });

  const personRecord = byId((devPeopleData as { peoples: MergedPerson[] }).peoples, person);
  if (!personRecord) {
    notFound();
  }

  const personName = locale === 'ko' ? personRecord.ko.name : personRecord.en.name;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

  const personLd = personJsonLd(personRecord, locale as 'ko' | 'en');
  const breadcrumbLd = breadcrumbListJsonLd([
    { name: t('spoke.breadcrumbHome'), url: `${siteUrl}/${locale}` },
    { name: t('title'), url: absoluteToolUrl(locale, 'dev-people') },
    { name: personName, url: absoluteEntityUrl(locale, 'dev-people', person) },
  ]);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-container px-6 py-16">
        {/* JSON-LD (rendered in body so crawlers see real script tags) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* Breadcrumb back-link + SNS share (shared template affordance) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <a
            href={absoluteToolUrl(locale, 'dev-people')}
            className="text-brand-ink hover:underline"
          >
            ← {t('title')}
          </a>
          <ShareButtons
            url={absoluteEntityUrl(locale, 'dev-people', person)}
            title={personName}
          />
        </div>

        <PersonSpoke person={personRecord} locale={locale as 'ko' | 'en'} />
      </div>
    </div>
  );
}
