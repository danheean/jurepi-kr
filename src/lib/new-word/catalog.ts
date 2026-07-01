import type { MergedTerm } from './schema';

/**
 * Return all terms (immutable reference)
 */
export function allTerms(catalog: MergedTerm[]): MergedTerm[] {
  return catalog;
}

/**
 * Find term by slug
 */
export function byId(catalog: MergedTerm[], slug: string): MergedTerm | null {
  return catalog.find((t) => t.slug === slug) || null;
}

/**
 * Filter terms by topic
 */
export function byTopic(catalog: MergedTerm[], topic: string): MergedTerm[] {
  return catalog.filter((t) => t.topic === topic);
}

/**
 * Get unique topic ids in sorted order
 */
export function topics(catalog: MergedTerm[]): string[] {
  const unique = new Set(catalog.map((t) => t.topic));
  return Array.from(unique).sort();
}

/**
 * Validate all `related` references exist in catalog.
 * Returns array of errors; empty = all valid.
 */
export function validateRelatedIntegrity(catalog: MergedTerm[]): string[] {
  const slugSet = new Set(catalog.map((t) => t.slug));
  const errors: string[] = [];

  catalog.forEach((term) => {
    term.related.forEach((ref) => {
      if (!slugSet.has(ref)) {
        errors.push(
          `${term.slug}: related references missing slug "${ref}"`
        );
      }
    });
  });

  return errors;
}

/**
 * Validate all slugs are unique
 */
export function validateUniqueSlugs(catalog: MergedTerm[]): string[] {
  const slugMap = new Map<string, number>();
  const errors: string[] = [];

  catalog.forEach((term, idx) => {
    if (slugMap.has(term.slug)) {
      errors.push(`Duplicate slug: ${term.slug}`);
    } else {
      slugMap.set(term.slug, idx);
    }
  });

  return errors;
}
