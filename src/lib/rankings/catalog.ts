import type { MergedRanking } from './schema';

/**
 * Return all rankings (immutable reference)
 */
export function allRankings(catalog: MergedRanking[]): MergedRanking[] {
  return catalog;
}

/**
 * Find ranking by slug
 */
export function byId(
  catalog: MergedRanking[],
  slug: string
): MergedRanking | null {
  return catalog.find((r) => r.slug === slug) || null;
}

/**
 * Filter rankings by field
 */
export function byField(catalog: MergedRanking[], field: string): MergedRanking[] {
  return catalog.filter((r) => r.field === field);
}

/**
 * Get unique field ids in canonical order (not sorted — order is as defined in enum).
 * Only return fields that exist in the catalog.
 */
export function fields(catalog: MergedRanking[]): string[] {
  const unique = new Set(catalog.map((r) => r.field));
  const fieldOrder = ['ai', 'programming', 'tech', 'games', 'movies', 'music'] as const;
  return fieldOrder.filter((f) => unique.has(f)) as string[];
}

/**
 * Validate all slugs are unique within their field.
 * Returns array of errors; empty = all valid.
 */
export function validateUniqueSlugPerField(catalog: MergedRanking[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, Set<string>>(); // field → {slugs}

  catalog.forEach((ranking) => {
    if (!seen.has(ranking.field)) {
      seen.set(ranking.field, new Set());
    }
    const fieldSlugs = seen.get(ranking.field)!;
    if (fieldSlugs.has(ranking.slug)) {
      errors.push(
        `Duplicate slug "${ranking.slug}" in field "${ranking.field}"`
      );
    } else {
      fieldSlugs.add(ranking.slug);
    }
  });

  return errors;
}

/**
 * Validate all items have consecutive ranks (1, 2, 3, ..., N).
 * Returns array of errors; empty = all valid.
 */
export function validateRanksConsecutive(catalog: MergedRanking[]): string[] {
  const errors: string[] = [];

  catalog.forEach((ranking) => {
    const koRanks = ranking.ko.items.map((i) => i.rank).sort((a, b) => a - b);
    const enRanks = ranking.en.items.map((i) => i.rank).sort((a, b) => a - b);

    const validateSequence = (ranks: number[], locale: string) => {
      for (let i = 0; i < ranks.length; i++) {
        if (ranks[i] !== i + 1) {
          errors.push(
            `${ranking.slug} (${locale}): ranks must be consecutive 1..N, got gap at position ${i + 1}`
          );
          break;
        }
      }
    };

    validateSequence(koRanks, 'ko');
    validateSequence(enRanks, 'en');
  });

  return errors;
}
