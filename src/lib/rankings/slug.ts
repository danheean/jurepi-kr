import type { RankingFileFront } from './schema';

/**
 * Slugify a string: lowercase, remove diacritics, replace spaces/special with hyphens.
 * Used for deriving slug from filename.
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
 * Resolve slug: use frontmatter slug if present, else derive from filename.
 * Examples:
 *   resolveSlug({title: "...", ...}, "best-sushi.md") → "best-sushi"
 *   resolveSlug({title: "...", slug: "custom-id", ...}, "best-sushi.md") → "custom-id"
 */
export function resolveSlug(front: RankingFileFront, filename: string): string {
  if (front.slug) {
    return front.slug;
  }
  // Derive: "best-sushi.md" or "best-sushi_en.md" → "best-sushi"
  const base = filename.replace(/(_en)?\.md$/, '');
  return slugify(base);
}
