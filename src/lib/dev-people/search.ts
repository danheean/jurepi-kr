import type { MergedPerson, Tag, Era } from './schema';

/**
 * Normalize query string: trim, NFC decompose, lowercase, remove diacritics.
 * Makes search case-insensitive and diacritic-insensitive.
 */
function normalize(text: string): string {
  return text
    .trim()
    .normalize('NFKD') // Decompose diacritics
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .toLowerCase();
}

/**
 * Check if haystack (normalized) includes needle (normalized).
 */
function includes(haystack: string, needle: string): boolean {
  return normalize(haystack).includes(normalize(needle));
}

/**
 * Filter people by query, optional tag, and optional era.
 *
 * Query matching: blank query → as-is.
 * Otherwise, match if ANY of:
 * - ko.name or en.name includes query
 * - ko.aliases or en.aliases includes query
 * - ko.knownFor or en.knownFor includes query
 * - tags includes query (as tag id)
 *
 * Tag filter: if tag present, AND with tag match.
 * Era filter: if era present, AND with era match.
 *
 * Returns filtered list in stable order (generation order preserved).
 */
export function filterPeople(
  people: MergedPerson[],
  query: string = '',
  tag?: Tag,
  era?: Era
): MergedPerson[] {
  let filtered = people;

  // Apply query filter
  if (query.trim()) {
    const q = query.trim();
    filtered = filtered.filter((p) => {
      // Match name (both locales)
      if (includes(p.ko.name, q) || includes(p.en.name, q)) return true;

      // Match aliases (both locales)
      if (p.ko.aliases?.some((alias) => includes(alias, q))) return true;
      if (p.en.aliases?.some((alias) => includes(alias, q))) return true;

      // Match knownFor (both locales)
      if (includes(p.ko.knownFor, q) || includes(p.en.knownFor, q)) return true;

      // Match tags (exact tag id)
      if (p.tags.includes(q as Tag)) return true;

      return false;
    });
  }

  // Apply tag filter
  if (tag) {
    filtered = filtered.filter((p) => p.tags.includes(tag));
  }

  // Apply era filter
  if (era) {
    filtered = filtered.filter((p) => p.era === era);
  }

  return filtered;
}
