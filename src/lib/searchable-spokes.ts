/**
 * Build a localized search index of every hub-and-spoke content entity
 * (glossary terms, ranking lists, bookmark topics, dev-people, how-to guides)
 * so the header search can find individual content pages, not just tools.
 *
 * Pure module: no React/Next/DOM. Imports the generated JSON catalogs directly
 * (same pattern as src/app/sitemap.ts) so counts stay in lock-step with content.
 */

import {
  markdownToPlainText,
  truncateToLength,
} from '@/lib/markdown/markdownToPlainText';
import type { SearchableSpoke } from '@/lib/tool-search';
import type { Translator } from '@/lib/searchable-tools';
import { getToolBySlug } from '@/tools/registry';
import type { AccentColor } from '@/tools/types';
import termsData from '@/components/tools/new-word/data/terms.generated.json';
import rankingsData from '@/components/tools/rankings/data/rankings.generated.json';
import bookmarksData from '@/components/tools/bookmarks/data/bookmarks.generated.json';
import devPeopleData from '@/components/tools/dev-people/data/dev-people.generated.json';
import guidesData from '@/components/tools/howto/data/guides.generated.json';

export type SpokeLocale = 'ko' | 'en';

/** Max characters for a spoke's display/search description. */
const DESCRIPTION_MAX = 100;

// Minimal shapes for the generated data (field names differ per collection).
interface Bilingual<T> {
  ko: T;
  en: T;
}
interface NewWordLoc {
  term: string;
  definition: string;
  aliases?: string[];
}
interface RankingLoc {
  title: string;
  sourceNote: string;
}
interface BookmarkLoc {
  title: string;
  description: string;
}
interface PersonLoc {
  name: string;
  knownFor: string;
  aliases?: string[];
}
interface GuideLoc {
  title: string;
  summary: string;
}
type Entity<T> = Bilingual<T> & { slug: string };

interface RawSpoke {
  slug: string;
  name: string;
  description: string;
  keywords?: string[];
}

/**
 * Attach the parent tool's identity + clean/truncate the description.
 * Falls back to a neutral accent/icon only if the parent is missing (drift).
 */
function buildSpoke(
  toolSlug: string,
  raw: RawSpoke,
  t: Translator
): SearchableSpoke {
  const parent = getToolBySlug(toolSlug);
  return {
    tool: toolSlug,
    slug: raw.slug,
    name: raw.name,
    description: truncateToLength(
      markdownToPlainText(raw.description),
      DESCRIPTION_MAX
    ),
    keywords: raw.keywords ?? [],
    parentToolName: t(`tools.${toolSlug}.title`),
    accent: (parent?.accent ?? 'coral') as AccentColor,
    icon: parent?.icon ?? 'Wrench',
  };
}

/**
 * Flatten all 5 content collections into a localized SearchableSpoke[].
 * Locale selects the ko/en subtree of each entity (content is self-contained;
 * only the parent tool name is resolved via the translator).
 */
export function toSearchableSpokes(
  t: Translator,
  locale: SpokeLocale
): SearchableSpoke[] {
  const spokes: SearchableSpoke[] = [];

  (termsData as Entity<NewWordLoc>[]).forEach((e) => {
    const loc = e[locale];
    spokes.push(
      buildSpoke(
        'new-word',
        {
          slug: e.slug,
          name: loc.term,
          description: loc.definition,
          keywords: loc.aliases,
        },
        t
      )
    );
  });

  (rankingsData as Entity<RankingLoc>[]).forEach((e) => {
    const loc = e[locale];
    spokes.push(
      buildSpoke(
        'rankings',
        { slug: e.slug, name: loc.title, description: loc.sourceNote },
        t
      )
    );
  });

  (bookmarksData as Entity<BookmarkLoc>[]).forEach((e) => {
    const loc = e[locale];
    spokes.push(
      buildSpoke(
        'bookmarks',
        { slug: e.slug, name: loc.title, description: loc.description },
        t
      )
    );
  });

  (devPeopleData as { peoples: Entity<PersonLoc>[] }).peoples.forEach((e) => {
    const loc = e[locale];
    spokes.push(
      buildSpoke(
        'dev-people',
        {
          slug: e.slug,
          name: loc.name,
          description: loc.knownFor,
          keywords: loc.aliases,
        },
        t
      )
    );
  });

  (guidesData as Entity<GuideLoc>[]).forEach((e) => {
    const loc = e[locale];
    spokes.push(
      buildSpoke(
        'howto',
        { slug: e.slug, name: loc.title, description: loc.summary },
        t
      )
    );
  });

  return spokes;
}
