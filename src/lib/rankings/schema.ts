import { z } from 'zod';

export const STORE_VERSION = 1;

/** Ranking domain field ids (Korean file canonical). Tabs derive from fields present in catalog. */
export const FIELD_ORDER = ['ai', 'programming', 'tech', 'games', 'movies', 'music', 'sports', 'education', 'business'] as const;
export type RankingField = (typeof FIELD_ORDER)[number];

/** Medal emoji for the top-3 ranks (index 0 = rank 1). */
export const MEDAL_EMOJI = ['🥇', '🥈', '🥉'] as const;

/** Search input debounce, ms. */
export const SEARCH_DEBOUNCE = 120;

/**
 * Individual markdown file frontmatter (parse unit).
 * Each ranking file (ko + en pair) has these top-level YAML fields.
 * For EN files: field, asOfDate, sourceNote, sourceUrl are optional (inherit from KO).
 */
export const RankingFileFrontSchema = z.object({
  // REQUIRED: title (per locale)
  title: z.string().min(1, 'title required'),

  // OPTIONAL (canonical from KO): field, asOfDate, sourceNote, sourceUrl
  // EN can omit these; validatePair will ensure they match if present
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music', 'sports', 'education', 'business']).optional(),
  asOfDate: z.string().min(1, 'asOfDate required (ISO date: YYYY-MM or YYYY-MM-DD)').optional(),
  sourceNote: z.string().min(1).max(200, 'sourceNote max 200 chars').optional(),
  sourceUrl: z.string().url().optional(), // NEW: optional clickable source link

  // OPTIONAL: derivable fields
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  // REQUIRED: items array
  items: z.array(
    z.object({
      rank: z.number().int().positive(),
      name: z.string().min(1, 'item name required'),
      description: z.string().min(1).max(200, 'item description max 200 chars'),
      link: z.string().url().optional(),
      imageUrl: z.string().url().optional(),
      imageWidth: z.number().int().positive().optional(),
      imageHeight: z.number().int().positive().optional(),
    })
  ).min(3, '≥3 items per ranking'),
});

export type RankingFileFront = z.infer<typeof RankingFileFrontSchema>;

/**
 * Merged ko+en record (catalog item).
 * Result of merging koFront + enFront via canonical rule.
 * This is what gets emitted to rankings.generated.json.
 * sourceNote is now per-locale (ko.sourceNote, en.sourceNote).
 */
export const MergedRankingSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be alphanumeric+hyphen'),
  field: z.enum(['ai', 'programming', 'tech', 'games', 'movies', 'music', 'sports', 'education', 'business']),
  asOfDate: z.string(), // ISO date
  sourceUrl: z.string().url().optional(),

  ko: z.object({
    title: z.string(),
    sourceNote: z.string(),
    items: z.array(
      z.object({
        rank: z.number().int(),
        name: z.string(),
        description: z.string(),
        link: z.string().optional(),
        imageUrl: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      })
    ),
  }),
  en: z.object({
    title: z.string(),
    sourceNote: z.string(),
    items: z.array(
      z.object({
        rank: z.number().int(),
        name: z.string(),
        description: z.string(),
        link: z.string().optional(),
        imageUrl: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      })
    ),
  }),
});

export type MergedRanking = z.infer<typeof MergedRankingSchema>;

/**
 * localStorage persistence blob.
 * Stores user preferences (favorites, recents).
 */
export const RankingsStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()), // ranking slugs
  recents: z.array(z.string()), // ranking slugs, MRU first
  meta: z.object({
    lastField: z.string().optional(),
    createdAt: z.number().int(),
  }),
});

export type RankingsStore = z.infer<typeof RankingsStoreSchema>;

/**
 * Safe JSON parsing helper (never throws, returns null on failure).
 * Used for corrupt localStorage recovery.
 */
export function safeJsonParse<T>(json: string, schema: z.ZodType<T>): T | null {
  try {
    const parsed = JSON.parse(json);
    const result = schema.safeParse(parsed);
    return result.success ? parsed : null;
  } catch {
    return null;
  }
}
