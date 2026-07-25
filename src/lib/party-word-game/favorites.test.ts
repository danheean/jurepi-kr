import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from './favorites';
import type { MergedDeck } from './types';

describe('favorites — immutable favorite and recent operations', () => {
  const mockCatalog: MergedDeck[] = [
    {
      slug: 'animals-a',
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
    {
      slug: 'animals-b',
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
    {
      slug: 'movies-a',
      words: Array.from({ length: 10 }, (_, i) => ({ term: `w${i}` })),
    },
  ];

  describe('toggleFavorite', () => {
    it('adds slug to empty list', () => {
      const result = toggleFavorite([], 'animals-a');
      expect(result).toEqual(['animals-a']);
    });

    it('removes slug if present', () => {
      const list = ['animals-a', 'animals-b'];
      const result = toggleFavorite(list, 'animals-a');
      expect(result).toEqual(['animals-b']);
    });

    it('preserves order of remaining slugs', () => {
      const list = ['a', 'b', 'c'];
      const result = toggleFavorite(list, 'b');
      expect(result).toEqual(['a', 'c']);
    });

    it('does not mutate input array', () => {
      const list = ['slug1', 'slug2'];
      const original = [...list];
      toggleFavorite(list, 'slug1');
      expect(list).toEqual(original);
    });

    it('adds new slug while preserving existing', () => {
      const list = ['a', 'b'];
      const result = toggleFavorite(list, 'c');
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    it('handles multiple toggles', () => {
      let result: string[] = [];
      result = toggleFavorite(result, 'animals-a');
      expect(result).toEqual(['animals-a']);
      result = toggleFavorite(result, 'animals-a');
      expect(result).toEqual([]);
    });
  });

  describe('pushRecent', () => {
    it('adds slug to empty list', () => {
      const result = pushRecent([], 'animals-a');
      expect(result).toEqual(['animals-a']);
    });

    it('moves existing slug to front', () => {
      const list = ['a', 'b', 'c'];
      const result = pushRecent(list, 'a');
      expect(result[0]).toBe('a');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('adds new slug to front', () => {
      const list = ['a', 'b'];
      const result = pushRecent(list, 'c');
      expect(result[0]).toBe('c');
      expect(result).toContain('a');
      expect(result).toContain('b');
    });

    it('de-duplicates: removes old position of moved slug', () => {
      const list = ['a', 'b', 'c'];
      const result = pushRecent(list, 'b');
      expect(result).toEqual(['b', 'a', 'c']);
    });

    it('truncates to max length (default 10)', () => {
      const list = Array.from({ length: 15 }, (_, i) => `slug${i}`);
      const result = pushRecent(list, 'new');
      expect(result.length).toBeLessThanOrEqual(RECENTS_MAX);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('respects custom max length', () => {
      const list = ['a', 'b', 'c'];
      const result = pushRecent(list, 'd', 2);
      expect(result.length).toBeLessThanOrEqual(2);
      expect(result[0]).toBe('d');
    });

    it('does not mutate input array', () => {
      const list = ['slug1', 'slug2'];
      const original = [...list];
      pushRecent(list, 'slug3');
      expect(list).toEqual(original);
    });

    it('maintains most-recent-first order', () => {
      let result: string[] = [];
      result = pushRecent(result, 'first');
      result = pushRecent(result, 'second');
      result = pushRecent(result, 'third');
      expect(result[0]).toBe('third');
      expect(result[1]).toBe('second');
      expect(result[2]).toBe('first');
    });

    it('RECENTS_MAX is 10', () => {
      expect(RECENTS_MAX).toBe(10);
    });
  });

  describe('pruneUnknown', () => {
    it('removes slugs not in catalog', () => {
      const slugs = ['animals-a', 'unknown', 'animals-b'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['animals-a', 'animals-b']);
    });

    it('keeps all known slugs', () => {
      const slugs = ['animals-a', 'animals-b', 'movies-a'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['animals-a', 'animals-b', 'movies-a']);
    });

    it('returns empty array when all slugs unknown', () => {
      const slugs = ['unknown1', 'unknown2'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual([]);
    });

    it('does not mutate input array', () => {
      const slugs = ['animals-a', 'unknown'];
      const original = [...slugs];
      pruneUnknown(slugs, mockCatalog);
      expect(slugs).toEqual(original);
    });

    it('preserves order of kept slugs', () => {
      const slugs = ['movies-a', 'animals-a', 'animals-b'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['movies-a', 'animals-a', 'animals-b']);
    });

    it('handles empty catalog', () => {
      const slugs = ['slug1', 'slug2'];
      const result = pruneUnknown(slugs, []);
      expect(result).toEqual([]);
    });

    it('handles empty slug list', () => {
      const result = pruneUnknown([], mockCatalog);
      expect(result).toEqual([]);
    });

    it('handles mixed known and unknown slugs', () => {
      const slugs = ['animals-a', 'ghost', 'animals-b', 'phantom', 'movies-a'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['animals-a', 'animals-b', 'movies-a']);
    });
  });
});
