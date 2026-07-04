import type { MergedPlaceList, Place } from './schema';

/**
 * Return all lists in order
 */
export function allPlaceLists(catalog: MergedPlaceList[]): MergedPlaceList[] {
  return catalog;
}

/**
 * Find list by slug (unique per region)
 */
export function byId(
  catalog: MergedPlaceList[],
  slug: string
): MergedPlaceList | null {
  return catalog.find((list) => list.slug === slug) || null;
}

/**
 * Parse placeId (format: "${listSlug}#${index}") and resolve to a Place object.
 * Returns null if placeId format is invalid, list not found, or index out of range.
 */
export function byPlaceId(
  catalog: MergedPlaceList[],
  placeId: string,
  locale: 'ko' | 'en'
): Place | null {
  // Parse placeId: format "${listSlug}#${index}"
  const match = placeId.match(/^(.+)#(\d+)$/);
  if (!match) {
    return null;
  }

  const [, listSlug, indexStr] = match;
  const index = parseInt(indexStr, 10);

  const list = byId(catalog, listSlug);
  if (!list) {
    return null;
  }

  const places = locale === 'ko' ? list.ko.places : list.en.places;
  if (index < 0 || index >= places.length) {
    return null;
  }

  return places[index];
}

/**
 * Filter lists by region
 */
export function byRegion(
  catalog: MergedPlaceList[],
  region: string
): MergedPlaceList[] {
  return catalog.filter((list) => list.region === region);
}

/**
 * Extract unique regions from catalog
 */
export function regions(catalog: MergedPlaceList[]): string[] {
  const seen = new Set<string>();
  catalog.forEach((list) => seen.add(list.region));
  return Array.from(seen);
}

/**
 * Extract unique categories from all places in catalog
 */
export function categories(catalog: MergedPlaceList[]): string[] {
  const seen = new Set<string>();
  catalog.forEach((list) => {
    list.ko.places.forEach((place) => seen.add(place.category));
  });
  return Array.from(seen);
}
