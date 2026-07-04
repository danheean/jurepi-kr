/**
 * Convert title to slug (ASCII, lowercase, hyphenated).
 * Note: Korean titles are not expected to be slugified directly;
 * instead, the slug is derived from the filename via resolveSlug().
 */
export function slugify(title: string): string {
  let slug = title.toLowerCase();

  // Remove apostrophes
  slug = slug.replace(/'/g, '');

  // Replace non-alphanumeric with space
  slug = slug.replace(/[^\w\s-]/g, ' ');

  // Collapse multiple spaces/dashes to single dash
  slug = slug
    .trim()
    .split(/[\s-]+/)
    .filter((word) => word.length > 0)
    .join('-');

  return slug;
}

export function resolveSlug(
  front: { slug?: string },
  filename: string
): string {
  // Explicit slug takes precedence
  if (front.slug) {
    return front.slug;
  }

  // Extract basename from path
  const basename = filename.split('/').pop() || filename;

  // Remove .md extension
  let slug = basename.replace(/\.md$/, '');

  // Remove _en suffix (before extension removal, but after we have the basename)
  slug = slug.replace(/_en$/, '');

  return slug;
}
