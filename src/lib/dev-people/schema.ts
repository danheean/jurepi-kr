import { z } from 'zod';

export const STORE_VERSION = 1;
export const RECENTS_MAX = 20;
export const SEARCH_DEBOUNCE = 120;
export const BIO_MIN_LENGTH = 50;
export const BIRTH_YEAR_MIN = 1800;
export const BIOGRAPHY_BODY_MIN_LENGTH = 100; // Thin-content guard: ≥100 chars substantive text

// Controlled vocabulary tags
export const TAG_VOCABULARY = [
  'java',
  'python',
  'javascript',
  'c',
  'cpp',
  'linux',
  'git',
  'ai',
  'deep-learning',
  'clean-code',
  'architecture',
  'tdd',
  'agile',
  'refactoring',
  'design-patterns',
  'free-software',
  'web',
  'game',
  'education',
  'youtube',
] as const;

export type Tag = (typeof TAG_VOCABULARY)[number];

// Era values
export const ERA_VALUES = [
  '1940-1960',
  '1960-1980',
  '1980-2000',
  '2000-present',
] as const;

export type Era = (typeof ERA_VALUES)[number];

/**
 * HTTP(S) URL validator — reject javascript:, data:, etc.
 */
function isHttpsUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * Individual markdown file frontmatter (parse unit).
 * Each person file (ko + en pair) has these top-level YAML fields.
 * NOTE: Per-locale requirements enforced in validatePair (ko: tags/era/nationality required).
 */
export const PersonFileFromSchema = z.object({
  // REQUIRED: name (per locale)
  name: z.string().min(1, 'name required'),

  // REQUIRED: knownFor (≥50 chars, plain text)
  knownFor: z.string().min(BIO_MIN_LENGTH, `knownFor must be ≥${BIO_MIN_LENGTH} chars`),

  // OPTIONAL: derivable slug (canonical from KO if absent)
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  // OPTIONAL but canonical in KO: tags (controlled vocab, ko required)
  tags: z.array(z.enum(TAG_VOCABULARY as unknown as [Tag, ...Tag[]])).optional(),

  // OPTIONAL but canonical in KO: era (ko required)
  era: z.enum(ERA_VALUES as unknown as [Era, ...Era[]]).optional(),

  // OPTIONAL but canonical in KO: nationality (ko required)
  nationality: z.string().optional(),

  // OPTIONAL: birthYear (≥1800, ≤ current year)
  birthYear: z
    .number()
    .int()
    .min(BIRTH_YEAR_MIN, `birthYear must be ≥${BIRTH_YEAR_MIN}`)
    .max(new Date().getFullYear(), 'birthYear cannot be in future')
    .optional(),

  // OPTIONAL: deathYear (only if birthYear present, > birthYear, ≤ current year)
  deathYear: z.number().int().optional(),

  // OPTIONAL: photo (local filename, e.g., "grace-hopper.jpg")
  photo: z.string().optional(),

  // REQUIRED if photo present: photoCredit (attribution)
  photoCredit: z.string().optional(),

  // OPTIONAL: achievements (ko canonical)
  achievements: z
    .array(
      z.object({
        year: z.number().int(),
        title: z.string().min(1),
      })
    )
    .optional(),

  // OPTIONAL: books (ko canonical; title localized, url shared)
  books: z
    .array(
      z.object({
        title: z.string().min(1),
        year: z.number().int().optional(),
        url: z
          .string()
          .url()
          .refine(isHttpsUrl, 'URL must be http(s)')
          .optional(),
      })
    )
    .optional(),

  // OPTIONAL: aliases (search aliases)
  aliases: z.array(z.string()).optional(),

  // OPTIONAL: related (other person slugs, validated at merge time)
  related: z.array(z.string()).optional(),

  // OPTIONAL: links (external references, http(s) only)
  links: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z
          .string()
          .url()
          .refine(isHttpsUrl, 'URL must be http(s)'),
      })
    )
    .optional(),

  // INTERNAL: biography_body (filled by generator from markdown body)
  biography_body: z.string().optional(),
});

export type PersonFileFront = z.infer<typeof PersonFileFromSchema>;

/**
 * Merged ko+en record (catalog item).
 * Result of merging koFront + enFront via canonical rule.
 * This is what gets emitted to dev-people.generated.json.
 *
 * INVARIANT:
 * - Both ko and en present with name/knownFor filled
 * - tags, era, nationality from ko (canonical)
 * - slug unique
 * - related/links point to real slugs (validated)
 * - photo/links validated (http(s), file exists)
 * - achievements/books count+years match ko↔en
 */
export const MergedPersonSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),

  // Canonical structural metadata
  tags: z.array(z.enum(TAG_VOCABULARY as unknown as [Tag, ...Tag[]])),
  era: z.enum(ERA_VALUES as unknown as [Era, ...Era[]]),
  nationality: z.string(),

  // Per-locale
  ko: z.object({
    name: z.string(),
    knownFor: z.string(),
    aliases: z.array(z.string()).optional(),
    biography_body: z.string().optional(),
  }),

  en: z.object({
    name: z.string(),
    knownFor: z.string(),
    aliases: z.array(z.string()).optional(),
    biography_body: z.string().optional(),
  }),

  // Optional root-level fields
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  photo: z.string().optional(),
  photoCredit: z.string().optional(),

  // Canonical arrays
  achievements: z
    .array(
      z.object({
        year: z.number().int(),
        ko: z.string(),
        en: z.string(),
      })
    )
    .optional(),

  books: z
    .array(
      z.object({
        ko: z.string(),
        en: z.string(),
        year: z.number().int().optional(),
        url: z.string().url().optional(),
      })
    )
    .optional(),

  related: z.array(z.string()).optional(),
  links: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});

export type MergedPerson = z.infer<typeof MergedPersonSchema>;

/**
 * localStorage persistence blob.
 * Stores user preferences (favorites, recents, metadata).
 */
export const DevPeopleStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()), // person slugs
  recents: z.array(z.string()), // person slugs, MRU first
  meta: z.object({
    lastQuery: z.string().optional(),
    lastTag: z.string().optional(),
    lastEra: z.string().optional(),
    createdAt: z.number().int(),
  }),
});

export type DevPeopleStore = z.infer<typeof DevPeopleStoreSchema>;

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
