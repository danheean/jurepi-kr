import { z } from 'zod';

export const STORE_VERSION = 1;

/**
 * Individual markdown file frontmatter (parse unit)
 */
export const TermFileFrontSchema = z.object({
  term: z.string().min(1, 'term required'),
  definition: z.string().min(1, 'definition required'),
  examples: z.array(z.string().min(1)).min(1, '≥1 example required'),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  topic: z.enum(['mz', 'tech']).optional(),
  reading: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  origin: z.string().optional(),
  coinedYear: z.number().int().optional(),
  related: z.array(z.string()).optional(),
});

export type TermFileFront = z.infer<typeof TermFileFrontSchema>;

/**
 * Merged ko+en record (catalog item)
 */
export const MergedTermSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.enum(['mz', 'tech']),
  tags: z.array(z.string()),
  coinedYear: z.number().int().optional(),
  related: z.array(z.string()),
  ko: z.object({
    term: z.string(),
    definition: z.string(),
    examples: z.array(z.string()),
    body: z.string(),
    reading: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    origin: z.string().optional(),
  }),
  en: z.object({
    term: z.string(),
    definition: z.string(),
    examples: z.array(z.string()),
    body: z.string(),
    reading: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    origin: z.string().optional(),
  }),
});

export type MergedTerm = z.infer<typeof MergedTermSchema>;

/**
 * localStorage blob
 */
export const GlossaryStoreSchema = z.object({
  version: z.number().int().min(1),
  favorites: z.array(z.string()),
  recents: z.array(z.string()),
  meta: z.object({
    lastTopic: z.string().optional(),
    lastLang: z.enum(['ko', 'en', 'both']).optional(),
    createdAt: z.number().int(),
  }),
});

export type GlossaryStore = z.infer<typeof GlossaryStoreSchema>;

/**
 * Safe JSON parsing (for corrupt localStorage recovery)
 * Returns null if parse or validation fails (never throws)
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
