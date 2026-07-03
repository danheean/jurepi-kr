import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getLiveTools } from '@/tools/registry';
import { absoluteEntityUrl } from '@/lib/seo';
import { byId } from '@/lib/new-word/catalog';
import termsData from '@/components/tools/new-word/data/terms.generated.json';
import rankingsData from '@/components/tools/rankings/data/rankings.generated.json';
import bookmarksData from '@/components/tools/bookmarks/data/bookmarks.generated.json';

// Required for output: 'export' — emit a static sitemap at build time.
export const dynamic = 'force-static';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const liveTools = getLiveTools();

  const staticPages = [
    {
      paths: locales.map((locale) => `/${locale}`),
      priority: 1.0,
    },
    {
      paths: locales.map((locale) => `/${locale}/about`),
      priority: 0.5,
    },
    {
      paths: locales.map((locale) => `/${locale}/privacy`),
      priority: 0.5,
    },
    {
      paths: locales.map((locale) => `/${locale}/terms`),
      priority: 0.5,
    },
    {
      paths: locales.map((locale) => `/${locale}/contact`),
      priority: 0.5,
    },
  ];

  const entries: MetadataRoute.Sitemap = [];

  staticPages.forEach(({ paths, priority }) => {
    paths.forEach((path) => {
      entries.push({
        url: `${siteUrl}${path}`,
        lastModified: new Date(),
        priority,
        changeFrequency: 'weekly',
      } as any);
    });
  });

  liveTools.forEach((tool) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${siteUrl}/${locale}/tools/${tool.slug}`,
        lastModified: new Date(),
        priority: 0.8,
        changeFrequency: 'monthly',
      } as any);
    });
  });

  // Add new-word spoke pages (16 terms × 2 locales = 32 entries)
  const catalog = termsData as any[];
  catalog.forEach((term) => {
    locales.forEach((locale) => {
      const url = absoluteEntityUrl(locale, 'new-word', term.slug);
      entries.push({
        url,
        lastModified: new Date(),
        priority: 0.7,
        changeFrequency: 'monthly',
      } as any);
    });
  });

  // Add rankings spoke pages (2 rankings × 2 locales = 4 entries)
  const rankingsCatalog = rankingsData as any[];
  rankingsCatalog.forEach((ranking) => {
    locales.forEach((locale) => {
      const url = absoluteEntityUrl(locale, 'rankings', ranking.slug);
      entries.push({
        url,
        lastModified: new Date(),
        priority: 0.7,
        changeFrequency: 'monthly',
      } as any);
    });
  });

  // Add bookmarks spoke pages (8 topics × 2 locales = 16 entries)
  const bookmarksCatalog = bookmarksData as any[];
  bookmarksCatalog.forEach((topic) => {
    locales.forEach((locale) => {
      const url = absoluteEntityUrl(locale, 'bookmarks', topic.slug);
      entries.push({
        url,
        lastModified: new Date(),
        priority: 0.7,
        changeFrequency: 'monthly',
      } as any);
    });
  });

  return entries;
}
