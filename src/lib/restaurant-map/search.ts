import type { Place } from './schema';

/**
 * Normalize string for search: NFC, lowercase, trim
 */
function normalizeQuery(query: string): string {
  return query.normalize('NFC').toLowerCase().trim();
}

/**
 * Filter places by query string.
 * Matches: name, category, address fields.
 * Case-insensitive, diacritic-insensitive (via NFC).
 */
export function filterPlaces(
  places: Place[],
  query: string,
  locale: 'ko' | 'en'
): Place[] {
  // Blank query returns all places
  if (!query || query.trim().length === 0) {
    return places;
  }

  const normalizedQuery = normalizeQuery(query);

  return places.filter((place) => {
    const normalizedName = normalizeQuery(place.name);
    const normalizedCategory = normalizeQuery(place.category);
    const normalizedAddress = normalizeQuery(place.address);

    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedCategory.includes(normalizedQuery) ||
      normalizedAddress.includes(normalizedQuery)
    );
  });
}
