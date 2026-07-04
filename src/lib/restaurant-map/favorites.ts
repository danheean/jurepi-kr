import type { MergedPlaceList } from './schema';
import { byId } from './catalog';

/**
 * Toggle favorite status for a place (identified by placeId).
 * If placeId is in ids, remove it; otherwise add it.
 * Returns new array (immutable).
 */
export function toggleFavorite(ids: string[], placeId: string): string[] {
  if (ids.includes(placeId)) {
    return ids.filter((id) => id !== placeId);
  } else {
    return [...ids, placeId];
  }
}

/**
 * Add or move placeId to the front of recents list.
 * De-duplicates and truncates to max length.
 * Returns new array (immutable).
 */
export function pushRecent(
  ids: string[],
  placeId: string,
  max: number = 20
): string[] {
  // Remove existing occurrence if present
  const filtered = ids.filter((id) => id !== placeId);

  // Add to front
  const result = [placeId, ...filtered];

  // Truncate to max
  return result.slice(0, max);
}

/**
 * Remove placeIds that are invalid:
 * - List slug not found in catalog
 * - Index out of range for that list's places[] length
 * Returns new array (immutable).
 */
export function pruneUnknown(
  ids: string[],
  catalog: MergedPlaceList[]
): string[] {
  return ids.filter((placeId) => {
    // Parse placeId: format "${listSlug}#${index}"
    const match = placeId.match(/^(.+)#(\d+)$/);
    if (!match) {
      return false; // Invalid format
    }

    const [, listSlug, indexStr] = match;
    const index = parseInt(indexStr, 10);

    const list = byId(catalog, listSlug);
    if (!list) {
      return false; // List not found
    }

    // Check if index is in range
    return index >= 0 && index < list.ko.places.length;
  });
}
