/**
 * Immutable operations on favorites and recents lists.
 * Never mutate the input; always return new arrays.
 */

/**
 * Toggle favorite: add slug if absent, remove if present.
 * Preserves order (remove doesn't shift indices, just omits).
 *
 * Returns new array (immutable).
 */
export function toggleFavorite(list: string[], slug: string): string[] {
  if (list.includes(slug)) {
    // Remove: return all except this slug
    return list.filter((s) => s !== slug);
  } else {
    // Add: append to end
    return [...list, slug];
  }
}

/**
 * Push slug to recents list (move to front if already present, add if new).
 * - If slug already in list, remove it first (move to front).
 * - Insert at front (MRU order: most recent first).
 * - Truncate to maxRecents.
 * - De-duplicate automatically (slug appears only once).
 *
 * Returns new array (immutable).
 */
export function pushRecent(list: string[], slug: string, maxRecents: number = 20): string[] {
  // Remove if already present
  let deduplicated = list.filter((s) => s !== slug);

  // Insert at front (MRU)
  const updated = [slug, ...deduplicated];

  // Truncate
  return updated.slice(0, maxRecents);
}

/**
 * Remove slugs from list that are not in the catalog.
 * Useful for loading from localStorage after catalog changes.
 *
 * Returns new array with unknown slugs removed (in original order).
 */
export function pruneUnknown(list: string[], validSlugs: string[]): string[] {
  const valid = new Set(validSlugs);
  return list.filter((slug) => valid.has(slug));
}
