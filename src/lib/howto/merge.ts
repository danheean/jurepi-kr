import type { GuideFile, GuideFileFront, MergedGuide } from './schema';
import { resolveSlug } from './slug';

// Partial front type for file input (some fields optional, topic required in KO)
export type PartialGuideFileFront = Partial<Omit<GuideFileFront, 'title' | 'summary'>> & {
  title: string;
  summary: string;
};

export interface MergeErrors {
  errors: Array<{ file: string; field: string; reason: string }>;
}

/**
 * Merge a Korean and English pair with canonical rule:
 * - Structural metadata (slug, topic, tags, order, updated, difficulty, coverImage, related) are CANONICAL in the Korean file.
 * - Locale-specific content (title, summary, body) is independent per file.
 * - If the English file has structural metadata, it must match the Korean file exactly.
 */
export function mergePair(
  koFront: PartialGuideFileFront,
  koBody: string,
  enFront: PartialGuideFileFront,
  enBody: string,
  koFilename: string
): { ok: true; value: MergedGuide } | { ok: false; errors: Array<{ file?: string; field?: string; reason: string }> } {
  const errors: Array<{ file?: string; field?: string; reason: string }> = [];

  // Resolve canonical slug from Korean file
  const slug = resolveSlug(koFront, koFilename);

  // Validate required fields per locale
  if (!koFront.title?.trim()) {
    errors.push({ field: 'ko.title', reason: 'title required and non-empty' });
  }
  if (!koFront.summary?.trim()) {
    errors.push({ field: 'ko.summary', reason: 'summary required and non-empty' });
  }
  if (!koBody?.trim()) {
    errors.push({ field: 'ko.body', reason: 'body required and non-empty' });
  }

  if (!enFront.title?.trim()) {
    errors.push({ field: 'en.title', reason: 'title required and non-empty' });
  }
  if (!enFront.summary?.trim()) {
    errors.push({ field: 'en.summary', reason: 'summary required and non-empty' });
  }
  if (!enBody?.trim()) {
    errors.push({ field: 'en.body', reason: 'body required and non-empty' });
  }

  // Topic is required in Korean file
  if (!koFront.topic) {
    errors.push({ field: 'topic', reason: 'topic required in Korean file' });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Canonical rule: structural metadata from Korean file, EN inherits or must match
  const topic = koFront.topic as 'setup' | 'ai-tools' | 'git' | 'api' | 'cli' | 'deploy';
  const tags = koFront.tags || [];
  const order = koFront.order ?? 999;
  const updated = koFront.updated;
  const difficulty = koFront.difficulty;
  const coverImage = koFront.coverImage;
  const related = koFront.related || [];

  // Check EN file doesn't contradict Korean file on canonical fields
  if (enFront.topic && enFront.topic !== topic) {
    errors.push({
      field: 'en.topic',
      reason: `must match Korean file (${topic})`,
    });
  }
  if (enFront.tags && JSON.stringify(enFront.tags) !== JSON.stringify(tags)) {
    errors.push({
      field: 'en.tags',
      reason: `must match Korean file or omit`,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const value: MergedGuide = {
    slug,
    topic,
    tags,
    order,
    updated,
    difficulty,
    coverImage,
    related,
    ko: {
      title: koFront.title!,
      summary: koFront.summary!,
      body: koBody!,
    },
    en: {
      title: enFront.title!,
      summary: enFront.summary!,
      body: enBody!,
    },
  };

  return { ok: true, value };
}

/**
 * Validate a merged guide in the context of a full catalog.
 * Checks slug uniqueness, related reference validity, etc.
 */
export function validatePair(
  slug: string,
  guide: MergedGuide,
  catalog: MergedGuide[]
): Array<{ field?: string; reason: string }> {
  const errors: Array<{ field?: string; reason: string }> = [];

  // Slug uniqueness
  const existing = catalog.find((g) => g.slug === slug);
  if (existing) {
    errors.push({ field: 'slug', reason: `Slug '${slug}' is not unique` });
  }

  // Related references must exist in catalog (including the guide being added)
  const allSlugs = new Set([...catalog.map((g) => g.slug), slug]);
  for (const ref of guide.related) {
    if (!allSlugs.has(ref)) {
      errors.push({ field: 'related', reason: `Related guide '${ref}' does not exist in catalog` });
    }
  }

  return errors;
}
