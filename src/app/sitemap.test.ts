import { describe, it, expect } from 'vitest';
import sitemap from './sitemap';
import { routing } from '@/i18n/routing';
import { getLiveTools } from '@/tools/registry';
import termsData from '@/components/tools/new-word/data/terms.generated.json';
import rankingsData from '@/components/tools/rankings/data/rankings.generated.json';
import bookmarksData from '@/components/tools/bookmarks/data/bookmarks.generated.json';
import devPeopleData from '@/components/tools/dev-people/data/dev-people.generated.json';
import guidesData from '@/components/tools/howto/data/guides.generated.json';

const STATIC_PAGE_COUNT = 5; // home, about, privacy, terms, contact

describe('sitemap (bot-optimized for Google Search Console)', () => {
  const entries = sitemap();

  it('derives entry count from registry and generated catalogs', () => {
    const perLocale =
      STATIC_PAGE_COUNT +
      getLiveTools().length +
      termsData.length +
      rankingsData.length +
      bookmarksData.length +
      (devPeopleData as { peoples: Array<{ slug: string }> }).peoples.length +
      guidesData.length;
    expect(entries).toHaveLength(routing.locales.length * perLocale);
  });

  it('every entry carries hreflang alternates for all locales, including itself', () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string> | undefined;
      expect(languages, `missing alternates: ${entry.url}`).toBeDefined();
      for (const locale of routing.locales) {
        expect(languages![locale], `missing ${locale} alternate: ${entry.url}`).toMatch(
          new RegExp(`/${locale}(/|$)`),
        );
      }
      expect(Object.values(languages!)).toContain(entry.url);
    }
  });

  it('never stamps build-time lastModified; only rankings and howto spokes carry content dates', () => {
    for (const entry of entries) {
      if (entry.url.includes('/tools/rankings/')) {
        const ranking = (rankingsData as Array<{ slug: string; asOfDate: string }>).find((r) =>
          entry.url.endsWith(`/tools/rankings/${r.slug}`),
        );
        expect(ranking, `unknown rankings spoke: ${entry.url}`).toBeDefined();
        expect(entry.lastModified).toBe(ranking!.asOfDate);
      } else if (entry.url.includes('/tools/howto/')) {
        const guide = (guidesData as Array<{ slug: string; updated?: string }>).find((g) =>
          entry.url.endsWith(`/tools/howto/${g.slug}`),
        );
        if (guide?.updated) {
          expect(entry.lastModified).toBe(guide.updated);
        } else {
          expect(entry.lastModified, `build-time lastmod leaked: ${entry.url}`).toBeUndefined();
        }
      } else {
        expect(entry.lastModified, `build-time lastmod leaked: ${entry.url}`).toBeUndefined();
      }
    }
  });

  it('all urls share the canonical site origin', () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';
    for (const entry of entries) {
      expect(entry.url.startsWith(`${siteUrl}/`)).toBe(true);
    }
  });
});
