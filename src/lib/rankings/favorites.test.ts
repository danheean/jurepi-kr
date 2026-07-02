import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from './favorites';
import type { MergedRanking } from './schema';

describe('favorites', () => {
  describe('toggleFavorite', () => {
    it('adds slug if not present', () => {
      const slugs = ['a', 'b'];
      const result = toggleFavorite(slugs, 'c');
      expect(result).toContain('c');
      expect(result.length).toBe(3);
    });

    it('removes slug if present', () => {
      const slugs = ['a', 'b', 'c'];
      const result = toggleFavorite(slugs, 'b');
      expect(result).not.toContain('b');
      expect(result.length).toBe(2);
    });

    it('preserves order of remaining items', () => {
      const slugs = ['a', 'b', 'c', 'd'];
      const result = toggleFavorite(slugs, 'b');
      expect(result).toEqual(['a', 'c', 'd']);
    });

    it('is immutable (does not mutate input)', () => {
      const original = ['a', 'b', 'c'];
      const result = toggleFavorite(original, 'd');
      expect(original).toEqual(['a', 'b', 'c']);
      expect(result).toContain('d');
    });

    it('handles empty array', () => {
      const result = toggleFavorite([], 'x');
      expect(result).toEqual(['x']);
    });

    it('appends new slug to end', () => {
      const slugs = ['a', 'b'];
      const result = toggleFavorite(slugs, 'c');
      expect(result[result.length - 1]).toBe('c');
    });

    it('handles removing from single-item array', () => {
      const result = toggleFavorite(['a'], 'a');
      expect(result).toEqual([]);
    });
  });

  describe('pushRecent', () => {
    it('adds slug to front if not present', () => {
      const slugs = ['b', 'c'];
      const result = pushRecent(slugs, 'a');
      expect(result[0]).toBe('a');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('moves slug to front if already present', () => {
      const slugs = ['a', 'b', 'c'];
      const result = pushRecent(slugs, 'b');
      expect(result[0]).toBe('b');
      expect(result).toEqual(['b', 'a', 'c']);
    });

    it('deduplicates slugs', () => {
      const slugs = ['a', 'b', 'c', 'a'];
      const result = pushRecent(slugs, 'a');
      const aCount = result.filter((s) => s === 'a').length;
      expect(aCount).toBe(1);
    });

    it('truncates to max length (default RECENTS_MAX)', () => {
      const slugs = Array.from({ length: RECENTS_MAX + 1 }, (_, i) =>
        String(i)
      );
      const result = pushRecent(slugs, 'new');
      expect(result.length).toBe(RECENTS_MAX);
    });

    it('respects custom max parameter', () => {
      const slugs = ['a', 'b', 'c', 'd', 'e'];
      const result = pushRecent(slugs, 'f', 3);
      expect(result.length).toBe(3);
      expect(result[0]).toBe('f');
    });

    it('is immutable', () => {
      const original = ['a', 'b', 'c'];
      const result = pushRecent(original, 'd');
      expect(original).toEqual(['a', 'b', 'c']);
      expect(result[0]).toBe('d');
    });

    it('maintains MRU order after multiple pushes', () => {
      let recents: string[] = [];
      recents = pushRecent(recents, 'a');
      recents = pushRecent(recents, 'b');
      recents = pushRecent(recents, 'c');
      expect(recents).toEqual(['c', 'b', 'a']);
    });

    it('handles empty array', () => {
      const result = pushRecent([], 'x');
      expect(result).toEqual(['x']);
    });

    it('truncates when max is reached', () => {
      const slugs = ['a', 'b', 'c'];
      const result = pushRecent(slugs, 'd', 3);
      expect(result).toEqual(['d', 'a', 'b']);
    });
  });

  describe('pruneUnknown', () => {
    const mockCatalog: MergedRanking[] = [
      {
        slug: 'ranking-1',
        field: 'ai',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        ko: {
          title: 'Test 1',
          items: [
            { rank: 1, name: 'Item', description: 'Desc' },
            { rank: 2, name: 'Item', description: 'Desc' },
            { rank: 3, name: 'Item', description: 'Desc' },
          ],
        },
        en: {
          title: 'Test 1',
          items: [
            { rank: 1, name: 'Item', description: 'Desc' },
            { rank: 2, name: 'Item', description: 'Desc' },
            { rank: 3, name: 'Item', description: 'Desc' },
          ],
        },
      },
      {
        slug: 'ranking-2',
        field: 'programming',
        asOfDate: '2026-06',
        sourceNote: 'Source',
        ko: {
          title: 'Test 2',
          items: [
            { rank: 1, name: 'Item', description: 'Desc' },
            { rank: 2, name: 'Item', description: 'Desc' },
            { rank: 3, name: 'Item', description: 'Desc' },
          ],
        },
        en: {
          title: 'Test 2',
          items: [
            { rank: 1, name: 'Item', description: 'Desc' },
            { rank: 2, name: 'Item', description: 'Desc' },
            { rank: 3, name: 'Item', description: 'Desc' },
          ],
        },
      },
    ];

    it('keeps known slugs', () => {
      const slugs = ['ranking-1', 'ranking-2'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['ranking-1', 'ranking-2']);
    });

    it('removes unknown slugs', () => {
      const slugs = ['ranking-1', 'unknown-slug', 'ranking-2'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['ranking-1', 'ranking-2']);
    });

    it('returns empty for all unknown slugs', () => {
      const slugs = ['unknown-1', 'unknown-2'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual([]);
    });

    it('is immutable', () => {
      const original = ['ranking-1', 'unknown'];
      const result = pruneUnknown(original, mockCatalog);
      expect(original).toEqual(['ranking-1', 'unknown']);
      expect(result).toEqual(['ranking-1']);
    });

    it('handles empty slug list', () => {
      const result = pruneUnknown([], mockCatalog);
      expect(result).toEqual([]);
    });

    it('handles empty catalog', () => {
      const slugs = ['ranking-1'];
      const result = pruneUnknown(slugs, []);
      expect(result).toEqual([]);
    });

    it('preserves order of known slugs', () => {
      const slugs = ['ranking-2', 'unknown', 'ranking-1', 'another-unknown'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['ranking-2', 'ranking-1']);
    });
  });

  describe('RECENTS_MAX constant', () => {
    it('is defined', () => {
      expect(RECENTS_MAX).toBeDefined();
    });

    it('is a positive integer', () => {
      expect(Number.isInteger(RECENTS_MAX)).toBe(true);
      expect(RECENTS_MAX).toBeGreaterThan(0);
    });

    it('is 20', () => {
      expect(RECENTS_MAX).toBe(20);
    });
  });
});
