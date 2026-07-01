import type { MergedTerm } from './schema';

/**
 * Normalize search text: lowercase, NFC, remove spaces/hyphens/underscores
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\s\-_]/g, ''); // Remove spaces, hyphens, underscores
}

/**
 * Filter terms by query, across both locales, case/diacritic insensitive.
 * Match if any of: term (ko+en), aliases (ko+en), definition (ko+en), tags.
 */
export function filterTerms(
  terms: MergedTerm[],
  query: string,
  locale?: 'ko' | 'en'
): MergedTerm[] {
  if (!query.trim()) {
    return terms;
  }

  const normalized = normalizeSearchText(query);

  return terms.filter((term) => {
    const koSearchText = normalizeSearchText(
      [
        term.ko.term,
        ...(term.ko.aliases || []),
        term.ko.definition,
        ...term.tags,
      ].join(' ')
    );
    const enSearchText = normalizeSearchText(
      [
        term.en.term,
        ...(term.en.aliases || []),
        term.en.definition,
        ...term.tags,
      ].join(' ')
    );

    return koSearchText.includes(normalized) || enSearchText.includes(normalized);
  });
}
