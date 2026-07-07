import { z } from 'zod';

export const STORE_VERSION = 1;
export const RECENTS_MAX = 20;

// Frontmatter schema per markdown file (each locale has its own file with optional canonical fields)
export const GuideFileSchema = z.object({
  title: z.string().min(1, 'title required'),
  summary: z.string().min(1, 'summary required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be ASCII alphanumeric+dash').optional(),
  topic: z.enum(['setup', 'ai-tools', 'git', 'api', 'cli', 'deploy']).optional(),
  tags: z.array(z.string()).optional().default([]),
  order: z.number().int().optional().default(999),
  updated: z.string().date().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  coverImage: z.string().optional(),
  related: z.array(z.string()).optional().default([]),
});

export type GuideFile = z.infer<typeof GuideFileSchema>;

// Alias for tests that expect this name (frontmatter from file)
export const GuideFileFrontSchema = GuideFileSchema;
export type GuideFileFront = GuideFile;

// Merged guide record (catalog item, ko+en with canonical rule applied)
export const MergedGuideSchema = z.object({
  slug: z.string(),
  topic: z.enum(['setup', 'ai-tools', 'git', 'api', 'cli', 'deploy']),
  tags: z.array(z.string()),
  order: z.number().int(),
  updated: z.string().date().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  coverImage: z.string().optional(),
  related: z.array(z.string()),
  ko: z.object({
    title: z.string(),
    summary: z.string(),
    body: z.string().min(1),
  }),
  en: z.object({
    title: z.string(),
    summary: z.string(),
    body: z.string().min(1),
  }),
});

export type MergedGuide = z.infer<typeof MergedGuideSchema>;

/**
 * Safe parse helper for GuideFileFront
 */
export function parseGuideFileFront(data: unknown):
  | { ok: true; value: GuideFileFront }
  | { ok: false; error: string } {
  const result = GuideFileFrontSchema.safeParse(data);
  if (result.success) {
    return { ok: true, value: result.data };
  }
  return { ok: false, error: result.error.message };
}

/**
 * Safe parse helper for MergedGuide
 */
export function parseMergedGuide(data: unknown):
  | { ok: true; data: MergedGuide }
  | { ok: false; error: string } {
  const result = MergedGuideSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, error: result.error.message };
}

// localStorage schema
export const HowtoStoreSchema = z.object({
  version: z.literal(STORE_VERSION),
  favorites: z.array(z.string()).optional().default([]),
  recents: z.array(z.string()).optional().default([]),
  meta: z.object({
    lastTopic: z.string().optional(),
    createdAt: z.number(),
  }).optional(),
});

export type HowtoStore = z.infer<typeof HowtoStoreSchema>;

// Topic union: canonical topic enum + virtual tabs
export type TopicTab = 'setup' | 'ai-tools' | 'git' | 'api' | 'cli' | 'deploy' | 'all' | 'favorites' | 'recent';

/**
 * Safe parse helper for HowtoStore
 */
export function parseHowtoStore(data: unknown):
  | { ok: true; data: HowtoStore }
  | { ok: false; error: string } {
  const result = HowtoStoreSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, error: result.error.message };
}
