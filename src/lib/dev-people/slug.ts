import type { PersonFileFront } from './schema';

/**
 * Derive slug from person name: remove diacritics, lowercase, space→hyphen.
 * Example: "Björn Stroustrup" → "bjorn-stroustrup"
 * ASCII-safe for URL / localStorage keys.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFKD') // Decompose diacritics
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric
    .replace(/^-+|-+$/g, '') // Trim hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}

/**
 * Resolve slug from PersonFileFront.
 * If front.slug is present (and ASCII), use it (ko canonical).
 * Otherwise, derive from front.name via slugify().
 *
 * Returns ASCII-safe slug suitable for URL/localStorage.
 */
export function resolveSlug(front: PersonFileFront, koFilename: string): string {
  if (front.slug) {
    // Validate it's ASCII-safe
    if (!/^[a-z0-9-]+$/.test(front.slug)) {
      throw new Error(
        `Invalid slug in ${koFilename}: "${front.slug}" must be ASCII alphanumeric + hyphens`
      );
    }
    return front.slug;
  }

  // Derive from name
  const derived = slugify(front.name);
  if (!derived) {
    throw new Error(
      `Cannot derive slug from name "${front.name}" in ${koFilename}`
    );
  }

  return derived;
}
