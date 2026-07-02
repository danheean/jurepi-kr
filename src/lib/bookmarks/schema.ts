import { z } from 'zod';

export const STORE_VERSION = 1;
export const RECENTS_MAX = 20;
export const SEARCH_DEBOUNCE = 120;
export const LINK_DESC_MAX = 100;
export const SECTION_MAX = 10;
export const LINKS_MIN_PER_TOPIC = 3;

/**
 * Individual markdown file frontmatter (parse unit).
 * Each bookmark file (ko + en pair) has these top-level YAML fields.
 */
export const BookmarkFileFrontSchema = z.object({
  // REQUIRED: title (per locale)
  title: z.string().min(1, 'title required'),

  // OPTIONAL: derivable slug (canonical from KO if absent)
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  // REQUIRED: description (≤200 chars, plain text)
  description: z.string().min(1, 'description required').max(200, 'description max 200 chars'),

  // REQUIRED: sections array (≥1 section, ≥3 links total per topic)
  sections: z
    .array(
      z.object({
        heading: z.string().min(1, 'section heading required'),
        links: z
          .array(
            z.object({
              label: z.string().min(1, 'link label required'),
              url: z.string().url('link url must be valid http(s) URL'),
              description: z.string().max(LINK_DESC_MAX, `link description max ${LINK_DESC_MAX} chars`).optional(),
              // BAKED by generator (authors don't write these)
              youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
              image: z.string().url().optional(),
            })
          )
          .min(1, 'section must have ≥1 link'),
      })
    )
    .min(1, 'topic must have ≥1 section'),
});

export type BookmarkFileFront = z.infer<typeof BookmarkFileFrontSchema>;

/**
 * Merged ko+en record (catalog item).
 * Result of merging koFront + enFront via canonical rule (ko slug canonical).
 * This is what gets emitted to bookmarks.generated.json.
 */
export const MergedTopicSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be alphanumeric+hyphen'),

  ko: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string(),
            description: z.string().optional(),
            // BAKED by generator
            youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
            image: z.string().url().optional(),
          })
        ),
      })
    ),
  }),

  en: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string(),
            description: z.string().optional(),
            // BAKED by generator
            youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
            image: z.string().url().optional(),
          })
        ),
      })
    ),
  }),
});

export type MergedTopic = z.infer<typeof MergedTopicSchema>;

/**
 * localStorage persistence blob.
 * Stores user preferences (favorites, recents, metadata).
 */
export const BookmarksStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()), // topic slugs
  recents: z.array(z.string()), // topic slugs, MRU first
  meta: z.object({
    lastQuery: z.string().optional(),
    createdAt: z.number().int(),
  }),
});

export type BookmarksStore = z.infer<typeof BookmarksStoreSchema>;

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
