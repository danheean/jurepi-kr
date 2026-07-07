export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function resolveSlug(frontmatter: { slug?: string }, filename: string): string {
  if (frontmatter.slug) {
    return frontmatter.slug;
  }
  // Derive from filename (strip _en suffix if present)
  const base = filename.replace(/_en$/, '').replace(/\.md$/, '');
  return slugify(base);
}
