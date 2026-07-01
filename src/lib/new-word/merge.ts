import { TermFileFrontSchema, type TermFileFront, type MergedTerm } from './schema';
import { resolveSlug } from './slug';

/**
 * Check if two string arrays are equal (order matters)
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}

/**
 * Merge ko + en pair following canonical rule:
 * - Structural metadata (topic, tags, slug, coinedYear, related) from KO
 * - EN inherits if absent; must match if present (error if conflict)
 * - Locale content (term, definition, examples, reading, aliases, origin) independent
 */
export function mergePair(
  koFront: TermFileFront,
  enFront: TermFileFront,
  koBody: string = '',
  enBody: string = ''
): MergedTerm {
  const slug = resolveSlug(koFront, 'unknown.md');
  const topic = koFront.topic || 'mz';
  const tags = koFront.tags || [];
  const related = koFront.related || [];

  return {
    slug,
    topic,
    tags,
    coinedYear: koFront.coinedYear,
    related,
    ko: {
      term: koFront.term,
      definition: koFront.definition,
      examples: koFront.examples,
      body: koBody,
      reading: koFront.reading,
      aliases: koFront.aliases,
      origin: koFront.origin,
    },
    en: {
      term: enFront.term,
      definition: enFront.definition,
      examples: enFront.examples,
      body: enBody,
      reading: enFront.reading,
      aliases: enFront.aliases,
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
  if (
    en.tags &&
    en.tags.length > 0 &&
    !arraysEqual(en.tags, ko.tags || [])
  ) {
    errors.push(`${koFilename}: EN tags must match KO`);
  }

  const term = mergePair(ko, en, '', '');

  return { term: errors.length === 0 ? term : null, errors };
}
