import type { MergedPerson, Tag, Era } from './schema';

/**
 * Pure, stateless catalog access functions.
 * Never modify the catalog; always return new data.
 *
 * The catalog is imported from dev-people.generated.json at runtime.
 */

/**
 * Get all people in generation order.
 */
export function allPeople(catalog: MergedPerson[]): MergedPerson[] {
  return catalog;
}

/**
 * Look up a person by slug.
 * Returns the person record or undefined if not found.
 */
export function byId(catalog: MergedPerson[], slug: string): MergedPerson | undefined {
  return catalog.find((p) => p.slug === slug);
}

/**
 * Get all people with a given tag.
 */
export function byTag(catalog: MergedPerson[], tag: Tag): MergedPerson[] {
  return catalog.filter((p) => p.tags.includes(tag));
}

/**
 * Get all people in a given era.
 */
export function byEra(catalog: MergedPerson[], era: Era): MergedPerson[] {
  return catalog.filter((p) => p.era === era);
}

/**
 * Get list of all person slugs (for favorites/recents validation).
 */
export function peoples(catalog: MergedPerson[]): string[] {
  return catalog.map((p) => p.slug);
}

/**
 * Validate that a slug exists in the catalog.
 * Returns true if found, false otherwise.
 */
export function hasSlug(catalog: MergedPerson[], slug: string): boolean {
  return catalog.some((p) => p.slug === slug);
}

/**
 * Validate that all related slugs exist in the catalog.
 * Useful for generator to check referential integrity.
 * Returns array of missing slugs (empty = all valid).
 */
export function validateRelated(
  catalog: MergedPerson[],
  relatedSlugs: string[] | undefined
): string[] {
  if (!relatedSlugs) return [];

  const catalogSlugs = new Set(peoples(catalog));
  return relatedSlugs.filter((slug) => !catalogSlugs.has(slug));
}
