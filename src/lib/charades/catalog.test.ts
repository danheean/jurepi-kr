import { describe, it, expect } from 'vitest';
import { CATEGORY_ORDER, createCatalog, validateUniqueSlugs } from './catalog';
import type { MergedDeck } from './schema';

describe('catalog — deck catalog operations', () => {
  const mockDeck = (slug: string, category: string = 'actions', difficulty: string = 'easy'): MergedDeck => ({
    slug,
    category: category as any,
    difficulty: difficulty as any,
    words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    ko: {
      title: `${category} ${slug} KO`,
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
    en: {
      title: `${category} ${slug} EN`,
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
  });

  const mockCatalog: MergedDeck[] = [
    mockDeck('actions-a', 'actions', 'easy'),
    mockDeck('actions-b', 'actions', 'easy'),
    mockDeck('sports-a', 'sports', 'normal'),
    mockDeck('emotions-a', 'emotions', 'hard'),
  ];

  describe('CATEGORY_ORDER', () => {
    it('exports 6 categories in correct order', () => {
      const expected = [
        'actions',
        'animals',
        'occupations',
        'characters',
        'sports',
        'emotions',
      ];
      expect(CATEGORY_ORDER).toEqual(expected);
    });
  });

  describe('createCatalog', () => {
    it('returns allDecks', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.allDecks).toEqual(mockCatalog);
    });

    it('provides byId', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.byId('actions-a')).toEqual(mockDeck('actions-a', 'actions', 'easy'));
    });

    it('byId returns undefined for unknown slug', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.byId('unknown')).toBeUndefined();
    });

    it('provides byCategory', () => {
      const catalog = createCatalog(mockCatalog);
      const actions = catalog.byCategory('actions');
      expect(actions).toHaveLength(2);
      expect(actions.map((d) => d.slug)).toEqual(['actions-a', 'actions-b']);
    });

    it('byCategory returns empty array for unknown category', () => {
      const catalog = createCatalog(mockCatalog);
      expect(catalog.byCategory('unknown')).toEqual([]);
    });

    it('provides categories (live category ids)', () => {
      const catalog = createCatalog(mockCatalog);
      const cats = catalog.categories();
      expect(cats).toContain('actions');
      expect(cats).toContain('sports');
      expect(cats).toContain('emotions');
      expect(cats).not.toContain('animals'); // not in catalog
      expect(cats).not.toContain('unknown');
    });

    it('categories are ordered by CATEGORY_ORDER', () => {
      const catalog = createCatalog([
        mockDeck('emotions-a', 'emotions', 'hard'),
        mockDeck('actions-a', 'actions', 'easy'),
        mockDeck('sports-a', 'sports', 'normal'),
      ]);
      const cats = catalog.categories();
      const emotions = cats.indexOf('emotions');
      const actions = cats.indexOf('actions');
      const sports = cats.indexOf('sports');
      expect(actions).toBeLessThan(sports);
      expect(sports).toBeLessThan(emotions);
    });
  });

  describe('validateUniqueSlugs', () => {
    it('returns empty errors for unique slugs', () => {
      const errors = validateUniqueSlugs(mockCatalog);
      expect(errors).toEqual([]);
    });

    it('detects duplicate slugs', () => {
      const dup = [
        mockDeck('actions-a', 'actions', 'easy'),
        mockDeck('actions-a', 'sports', 'easy'), // same slug, different category
      ];
      const errors = validateUniqueSlugs(dup);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/actions-a/);
    });

    it('detects duplicate slugs within same category', () => {
      // Per SPEC: slug is globally unique (not per-category)
      const dup = [
        mockDeck('actions-a', 'actions', 'easy'),
        mockDeck('actions-a', 'actions', 'hard'), // same slug, same category
      ];
      const errors = validateUniqueSlugs(dup);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('handles empty catalog', () => {
      const errors = validateUniqueSlugs([]);
      expect(errors).toEqual([]);
    });
  });
});
