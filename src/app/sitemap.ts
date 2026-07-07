import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getLiveTools } from '@/tools/registry';
import { absoluteEntityUrl } from '@/lib/seo';
import termsData from '@/components/tools/new-word/data/terms.generated.json';
import rankingsData from '@/components/tools/rankings/data/rankings.generated.json';
import bookmarksData from '@/components/tools/bookmarks/data/bookmarks.generated.json';
import devPeopleData from '@/components/tools/dev-people/data/dev-people.generated.json';
import guidesData from '@/components/tools/howto/data/guides.generated.json';

// Required for output: 'export' — emit a static sitemap at build time.
export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

type SitemapEntry = MetadataRoute.Sitemap[number];
type Locale = (typeof routing.locales)[number];

/**
 * One <url> per locale, each carrying the full hreflang alternate set
 * (Google requires every listed URL to declare all of its language variants).
 * No build-time lastModified — a lastmod that changes on every deploy is
 * treated as unreliable by crawlers; pass `lastModified` only when a real
 * content date exists.
 */
function localizedEntries(
  urlFor: (locale: Locale) => string,
  extra: Omit<Partial<SitemapEntry>, 'url' | 'alternates'> = {},
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, urlFor(locale)]),
  ) as Record<Locale, string>;

  return routing.locales.map((locale) => ({
    url: urlFor(locale),
    alternates: { languages },
    ...extra,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: ReadonlyArray<{ path: string; priority: number }> = [
    { path: '', priority: 1.0 },
    { path: '/about', priority: 0.5 },
    { path: '/privacy', priority: 0.5 },
    { path: '/terms', priority: 0.5 },
    { path: '/contact', priority: 0.5 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  staticPages.forEach(({ path, priority }) => {
    entries.push(
      ...localizedEntries((locale) => `${siteUrl}/${locale}${path}`, {
        priority,
        changeFrequency: 'weekly',
      }),
    );
  });

  getLiveTools().forEach((tool) => {
    entries.push(
      ...localizedEntries((locale) => `${siteUrl}/${locale}/tools/${tool.slug}`, {
        priority: 0.8,
        changeFrequency: 'monthly',
      }),
    );
  });

  // Entity spoke pages (hub-and-spoke content collections).
  (termsData as Array<{ slug: string }>).forEach((term) => {
    entries.push(
      ...localizedEntries((locale) => absoluteEntityUrl(locale, 'new-word', term.slug), {
        priority: 0.7,
        changeFrequency: 'monthly',
      }),
    );
  });

  // Rankings carry a real content date (asOfDate) — the only honest lastmod we have.
  (rankingsData as Array<{ slug: string; asOfDate: string }>).forEach((ranking) => {
    entries.push(
      ...localizedEntries((locale) => absoluteEntityUrl(locale, 'rankings', ranking.slug), {
        priority: 0.7,
        changeFrequency: 'monthly',
        lastModified: ranking.asOfDate,
      }),
    );
  });

  (bookmarksData as Array<{ slug: string }>).forEach((topic) => {
    entries.push(
      ...localizedEntries((locale) => absoluteEntityUrl(locale, 'bookmarks', topic.slug), {
        priority: 0.7,
        changeFrequency: 'monthly',
      }),
    );
  });

  // Developer people profiles
  (devPeopleData as { peoples: Array<{ slug: string }> }).peoples.forEach((person) => {
    entries.push(
      ...localizedEntries((locale) => absoluteEntityUrl(locale, 'dev-people', person.slug), {
        priority: 0.7,
        changeFrequency: 'monthly',
      }),
    );
  });

  // How-to guide pages
  (guidesData as Array<{ slug: string; updated?: string }>).forEach((guide) => {
    entries.push(
      ...localizedEntries((locale) => absoluteEntityUrl(locale, 'howto', guide.slug), {
        priority: 0.7,
        changeFrequency: 'monthly',
        ...(guide.updated && { lastModified: guide.updated }),
      }),
    );
  });

  return entries;
}
