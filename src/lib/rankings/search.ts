import type { MergedRanking } from './schema';

/**
 * Normalize search text: lowercase, NFC, remove spaces/hyphens/underscores.
 * Makes search case/diacritic insensitive and space-insensitive.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\s\-_]/g, ''); // Remove spaces, hyphens, underscores
}

/**
 * Filter rankings by query, across both locales.
 * Match if any of: ranking title (ko+en), field, item names, descriptions (both locales).
 * Returns filtered list in stable order.
 */
export function filterRankings(
  rankings: MergedRanking[],
  query: string
): MergedRanking[] {
  if (!query.trim()) {
    return rankings;
  }

  const normalized = normalizeSearchText(query);

  return rankings.filter((ranking) => {
    const koSearchText = normalizeSearchText(
      [
        ranking.ko.title,
        ranking.field,
        ...ranking.ko.items.map((item) => `${item.name} ${item.description}`),
      ].join(' ')
    );
    const enSearchText = normalizeSearchText(
      [
        ranking.en.title,
        ranking.field,
        ...ranking.en.items.map((item) => `${item.name} ${item.description}`),
      ].join(' ')
    );

    return koSearchText.includes(normalized) || enSearchText.includes(normalized);
  });
}
