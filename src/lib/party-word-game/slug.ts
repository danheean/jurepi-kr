import type { DeckFile } from './types';

/**
 * Slugify a string: lowercase, remove diacritics, replace spaces/special with hyphens
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except hyphens
    .replace(/\s+/g, '-') // Space → hyphen
    .replace(/-+/g, '-') // Collapse hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
}

/**
 * Resolve slug: use frontmatter slug if present, else derive from filename
 */
export function resolveSlug(front: DeckFile, filename: string): string {
  if (front.slug) {
    return front.slug;
  }
  // Derive from filename: "animals-a.md" or "animals-a_en.md" → "animals-a"
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}
