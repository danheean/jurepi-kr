import { RECENTS_MAX } from './schema';
import type { MergedGuide } from './schema';

// Re-export for convenience
export { RECENTS_MAX };

/**
 * Toggle favorite: if present, remove; if absent, add.
 * Returns new array (immutable).
 */
export function toggleFavorite(list: string[], slug: string): string[] {
  if (list.includes(slug)) {
    return list.filter((s) => s !== slug);
  }
  return [...list, slug];
}

/**
 * Add or move slug to front of recents list, de-duplicate.
 * Truncate to max.
 */
export function pushRecent(list: string[], slug: string, max: number = RECENTS_MAX): string[] {
  const filtered = list.filter((s) => s !== slug);
  return [slug, ...filtered].slice(0, max);
}

/**
 * Remove any slug from list that's not in the catalog.
 * Useful for cleanup when guides are removed.
 */
export function pruneUnknown(
  list: string[],
  catalog: MergedGuide[]
): string[] {
  const catalogSlugs = new Set(catalog.map((g) => g.slug));
  return list.filter((slug) => catalogSlugs.has(slug));
}
