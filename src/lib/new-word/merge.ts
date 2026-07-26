import { TermFileFrontSchema, type TermFileFront, type MergedTerm } from './schema';
import { resolveSlug } from './slug';

/**
 * Merge ko + en pair following canonical rule:
 * - Structural metadata (topic, slug, coinedYear, related) from KO
 * - Locale content (term, definition, examples, reading, aliases, tags, origin)
 *   is per-locale. `tags` is localized like aliases: EN uses its own if present,
 *   otherwise inherits KO (so shared/acronym tags need no override).
 */
export function mergePair(
  koFront: TermFileFront,
  enFront: TermFileFront,
  koBody: string = '',
  enBody: string = ''
): MergedTerm {
  const slug = resolveSlug(koFront, 'unknown.md');
  const topic = koFront.topic || 'mz';
  const related = koFront.related || [];
  const koTags = koFront.tags || [];
  // EN inherits KO tags unless its own file provides a (non-empty) tags list.
  const enTags = enFront.tags && enFront.tags.length > 0 ? enFront.tags : koTags;

  return {
    slug,
    topic,
    coinedYear: koFront.coinedYear,
    related,
    tone: koFront.tone,
    ko: {
      term: koFront.term,
      definition: koFront.definition,
      examples: koFront.examples,
      body: koBody,
      reading: koFront.reading,
      aliases: koFront.aliases,
      tags: koTags,
      origin: koFront.origin,
    },
    en: {
      term: enFront.term,
      definition: enFront.definition,
      examples: enFront.examples,
      body: enBody,
      reading: enFront.reading,
      aliases: enFront.aliases,
      tags: enTags,
      origin: enFront.origin,
    },
  };
}

/**
 * Validate pair + merged record; collect all errors (non-blocking).
 * Returns { term: MergedTerm | null, errors: string[] }
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { term: MergedTerm | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = TermFileFrontSchema.safeParse(koFront);
  const enResult = TermFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { term: null, errors };
  }

  // Canonical rule check: EN must not override structural metadata
  const ko = koResult.data!;
  const en = enResult.data!;

  if (en.topic && en.topic !== ko.topic) {
    errors.push(
      `${koFilename}: EN topic must match KO (KO="${ko.topic}", EN="${en.topic}")`
    );
  }
  if (en.tone && en.tone !== ko.tone) {
    errors.push(
      `${koFilename}: EN tone must match KO (KO="${ko.tone}", EN="${en.tone}")`
    );
  }
  // NOTE: `tags` is per-locale (localized like aliases) — EN may differ from KO.

  const term = mergePair(ko, en, '', '');

  return { term: errors.length === 0 ? term : null, errors };
}
