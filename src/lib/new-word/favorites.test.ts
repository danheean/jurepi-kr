import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from './favorites';
import type { MergedTerm } from './schema';

describe('favorites — immutable operations', () => {
  const mockCatalog: MergedTerm[] = [
    {
      slug: 'god-saeng',
      topic: 'mz',
      tags: [],
      related: [],
      ko: { term: '갓생', definition: 'd', examples: ['e'], body: '' },
      en: { term: 'god life', definition: 'd', examples: ['e'], body: '' },
    },
    {
      slug: 'vibe-coding',
      topic: 'tech',
      tags: [],
      related: [],
      ko: { term: '바이브 코딩', definition: 'd', examples: ['e'], body: '' },
      en: { term: 'Vibe Coding', definition: 'd', examples: ['e'], body: '' },
    },
    {
      slug: 'king-batda',
      topic: 'mz',
      tags: [],
      related: [],
      ko: { term: '킹받다', definition: 'd', examples: ['e'], body: '' },
      en: { term: 'annoyed', definition: 'd', examples: ['e'], body: '' },
    },
  ];

  describe('toggleFavorite', () => {
    it('adds slug to empty list', () => {
      const result = toggleFavorite([], 'god-saeng');
      expect(result).toEqual(['god-saeng']);
    });

    it('removes slug if present', () => {
      const list = ['god-saeng', 'vibe-coding'];
      const result = toggleFavorite(list, 'god-saeng');
      expect(result).toEqual(['vibe-coding']);
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
  });

  describe('pushRecent', () => {
    it('adds slug to empty list', () => {
      const result = pushRecent([], 'god-saeng');
      expect(result).toEqual(['god-saeng']);
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

    it('truncates to max length (default 20)', () => {
      const list = Array.from({ length: 25 }, (_, i) => `slug${i}`);
      const result = pushRecent(list, 'new');
      expect(result.length).toBeLessThanOrEqual(RECENTS_MAX);
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
  });

  describe('pruneUnknown', () => {
    it('removes slugs not in catalog', () => {
      const slugs = ['god-saeng', 'unknown', 'vibe-coding'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['god-saeng', 'vibe-coding']);
    });

    it('keeps all known slugs', () => {
      const slugs = ['god-saeng', 'vibe-coding'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['god-saeng', 'vibe-coding']);
    });

    it('returns empty array when all slugs unknown', () => {
      const slugs = ['unknown1', 'unknown2'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual([]);
    });

    it('does not mutate input array', () => {
      const slugs = ['god-saeng', 'unknown'];
      const original = [...slugs];
      pruneUnknown(slugs, mockCatalog);
      expect(slugs).toEqual(original);
    });

    it('preserves order of kept slugs', () => {
      const slugs = ['vibe-coding', 'god-saeng', 'king-batda'];
      const result = pruneUnknown(slugs, mockCatalog);
      expect(result).toEqual(['vibe-coding', 'god-saeng', 'king-batda']);
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
  });
});
