import type { MergedDeck } from './schema';

export const CATEGORY_ORDER = [
  'actions',
  'animals',
  'occupations',
  'characters',
  'sports',
  'emotions',
] as const;

export type CategoryEnum = (typeof CATEGORY_ORDER)[number];

/**
 * Catalog accessor interface
 */
export interface CharadesCatalog {
  allDecks: MergedDeck[];
  byId(slug: string): MergedDeck | undefined;
  byCategory(category: string): MergedDeck[];
  categories(): string[];
}

/**
 * Create a catalog from an array of decks
 */
export function createCatalog(decks: MergedDeck[]): CharadesCatalog {
  const deckMap = new Map(decks.map((d) => [d.slug, d]));
  const byCategory = new Map<string, MergedDeck[]>();

  for (const deck of decks) {
    const current = byCategory.get(deck.category) || [];
    current.push(deck);
    byCategory.set(deck.category, current);
  }

  return {
    allDecks: decks,
    byId: (slug: string) => deckMap.get(slug),
    byCategory: (category: string) => byCategory.get(category) || [],
    categories: () => {
      const live = Array.from(byCategory.keys());
      return live.sort(
        (a, b) => CATEGORY_ORDER.indexOf(a as CategoryEnum) - CATEGORY_ORDER.indexOf(b as CategoryEnum)
      );
    },
  };
}

/**
 * Validate slug uniqueness globally (not per-category)
 */
export function validateUniqueSlugs(decks: MergedDeck[]): string[] {
  const errors: string[] = [];
  const seen = new Map<string, MergedDeck>();

  for (const deck of decks) {
    if (seen.has(deck.slug)) {
      errors.push(`slug "${deck.slug}" is not unique (appears in multiple decks)`);
    }
    seen.set(deck.slug, deck);
  }

  return errors;
}
