import {
  BookmarkFileFrontSchema,
  type BookmarkFileFront,
  type MergedTopic,
  LINKS_MIN_PER_TOPIC,
} from './schema';
import { resolveSlug } from './slug';

/**
 * Normalize a raw markdown body into the optional long-form `body` field.
 * The spoke page already renders the topic title as the page H1, so a leading
 * top-level `# heading` in the body is stripped to avoid a duplicate H1.
 * Returns undefined for empty/whitespace-only bodies (so `body` stays absent).
 */
export function normalizeBody(raw?: string): string | undefined {
  if (!raw) return undefined;
  // Strip a single leading top-level "# heading" line (## and deeper are kept).
  const stripped = raw.replace(/^﻿?\s*#\s+[^\n]*\r?\n+/, '');
  const trimmed = stripped.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Merge ko + en pair following canonical rule:
 * - Slug from KO canonical (en inherits if absent)
 * - Title, description, sections are PER-LOCALE (can differ)
 *
 * INVARIANT: every merged record has both ko+en with ≥1 section, ≥3 links total.
 */
export function mergePair(
  koFront: BookmarkFileFront,
  enFront: BookmarkFileFront,
  koFilename: string = 'unknown.md',
  koBody?: string,
  enBody?: string
): MergedTopic {
  const slug = resolveSlug(koFront, koFilename);
  const koBodyNorm = normalizeBody(koBody);
  const enBodyNorm = normalizeBody(enBody);

  return {
    slug,
    ko: {
      title: koFront.title,
      description: koFront.description,
      sections: koFront.sections,
      ...(koBodyNorm ? { body: koBodyNorm } : {}),
    },
    en: {
      title: enFront.title,
      description: enFront.description,
      sections: enFront.sections,
      ...(enBodyNorm ? { body: enBodyNorm } : {}),
    },
  };
}

/**
 * Validate ko+en pair and return merged record + errors.
 * Errors are non-blocking (collect all before failing).
 * Returns { topic: MergedTopic | null, errors: string[] }.
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown,
  koBody?: string,
  enBody?: string
): { topic: MergedTopic | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = BookmarkFileFrontSchema.safeParse(koFront);
  const enResult = BookmarkFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { topic: null, errors };
  }

  const ko = koResult.data!;
  const en = enResult.data!;

  // Validate ko/en link counts (≥3 links total per topic per locale)
  const koLinkCount = ko.sections.reduce((acc, sec) => acc + sec.links.length, 0);
  const enLinkCount = en.sections.reduce((acc, sec) => acc + sec.links.length, 0);

  if (koLinkCount < LINKS_MIN_PER_TOPIC) {
    errors.push(
      `${koFilename}: KO has ${koLinkCount} links, need ≥${LINKS_MIN_PER_TOPIC}`
    );
  }
  if (enLinkCount < LINKS_MIN_PER_TOPIC) {
    errors.push(
      `${koFilename}: EN has ${enLinkCount} links, need ≥${LINKS_MIN_PER_TOPIC}`
    );
  }

  if (errors.length > 0) {
    return { topic: null, errors };
  }

  const topic = mergePair(ko, en, koFilename, koBody, enBody);

  return { topic, errors: [] };
}
