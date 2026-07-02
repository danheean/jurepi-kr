import {
  RankingFileFrontSchema,
  type RankingFileFront,
  type MergedRanking,
} from './schema';
import { resolveSlug } from './slug';

/**
 * Merge ko + en pair following canonical rule:
 * - Structural fields (field, asOfDate, sourceNote, sourceUrl) from KO canonical
 * - EN inherits if absent; must match if present (error if conflict)
 * - Locale items (title, items[]) independent per locale
 *
 * INVARIANT: every merged record has both ko+en with ≥3 items each.
 */
export function mergePair(
  koFront: RankingFileFront,
  enFront: RankingFileFront,
  koFilename: string = 'unknown.md'
): MergedRanking {
  const slug = resolveSlug(koFront, koFilename);
  // Canonical fields are required on the merged record. Callers (validatePair /
  // the generator) guarantee presence; guard here to narrow the optional
  // frontmatter types and fail loudly if a caller bypasses validation.
  if (!koFront.field || !koFront.asOfDate || !koFront.sourceNote) {
    throw new Error(
      `mergePair: KO field/asOfDate/sourceNote are required (${koFilename})`
    );
  }
  const field = koFront.field;
  const asOfDate = koFront.asOfDate;
  const sourceNote = koFront.sourceNote;
  const sourceUrl = koFront.sourceUrl;

  return {
    slug,
    field,
    asOfDate,
    sourceNote,
    sourceUrl,
    ko: {
      title: koFront.title,
      items: koFront.items,
    },
    en: {
      title: enFront.title,
      items: enFront.items,
    },
  };
}

/**
 * Validate ko+en pair and return merged record + errors.
 * Errors are non-blocking (collect all before failing).
 * Returns { ranking: MergedRanking | null, errors: string[] }.
 */
export function validatePair(
  koFilename: string,
  koFront: unknown,
  enFront: unknown
): { ranking: MergedRanking | null; errors: string[] } {
  const errors: string[] = [];

  // Parse frontmatter
  const koResult = RankingFileFrontSchema.safeParse(koFront);
  const enResult = RankingFileFrontSchema.safeParse(enFront);

  if (!koResult.success) {
    errors.push(`${koFilename}: KO parse error — ${koResult.error.message}`);
  }
  if (!enResult.success) {
    errors.push(`${koFilename}: EN parse error — ${enResult.error.message}`);
  }

  if (errors.length > 0) {
    return { ranking: null, errors };
  }

  const ko = koResult.data!;
  const en = enResult.data!;

  // Validate KO has all required canonical fields
  if (!ko.field) {
    errors.push(`${koFilename}: KO field is required`);
  }
  if (!ko.asOfDate) {
    errors.push(`${koFilename}: KO asOfDate is required`);
  }
  if (!ko.sourceNote) {
    errors.push(`${koFilename}: KO sourceNote is required`);
  }

  if (errors.length > 0) {
    return { ranking: null, errors };
  }

  // Canonical rule check: EN field/asOfDate/sourceNote must not override KO if present
  if (en.field && en.field !== ko.field) {
    errors.push(
      `${koFilename}: EN field must match KO (KO="${ko.field}", EN="${en.field}")`
    );
  }
  if (en.asOfDate && en.asOfDate !== ko.asOfDate) {
    errors.push(
      `${koFilename}: EN asOfDate must match KO (KO="${ko.asOfDate}", EN="${en.asOfDate}")`
    );
  }
  if (en.sourceNote && en.sourceNote !== ko.sourceNote) {
    errors.push(`${koFilename}: EN sourceNote must match KO`);
  }
  if (en.sourceUrl && en.sourceUrl !== ko.sourceUrl) {
    errors.push(`${koFilename}: EN sourceUrl must match KO`);
  }

  const ranking = mergePair(ko, en, koFilename);

  return { ranking: errors.length === 0 ? ranking : null, errors };
}
