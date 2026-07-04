import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown } from './favorites';
import type { MergedPlaceList } from './schema';

describe('favorites', () => {
  const createMockCatalog = (): MergedPlaceList[] => [
    {
      slug: 'list-1',
      region: 'seoul',
      asOfDate: '2026-07-04',
      ko: {
        title: 'List 1',
        sourceNote: 'Note',
        places: [
          {
            id: 'list-1#0',
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
          {
            id: 'list-1#1',
            name: 'Place 2',
            lat: 37.6,
            lng: 127.1,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
          {
            id: 'list-1#2',
            name: 'Place 3',
            lat: 37.7,
            lng: 127.2,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
        ],
      },
      en: {
        title: 'List 1',
        sourceNote: 'Note',
        places: [
          {
            id: 'list-1#0',
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
          {
            id: 'list-1#1',
            name: 'Place 2',
            lat: 37.6,
            lng: 127.1,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
          {
            id: 'list-1#2',
            name: 'Place 3',
            lat: 37.7,
            lng: 127.2,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
        ],
      },
    },
  ];

  describe('toggleFavorite', () => {
    it('adds placeId if not present', () => {
      const ids: string[] = [];
      const result = toggleFavorite(ids, 'list-1#0');
      expect(result).toContain('list-1#0');
      expect(result).toHaveLength(1);
    });

    it('removes placeId if present', () => {
      const ids = ['list-1#0', 'list-1#1'];
      const result = toggleFavorite(ids, 'list-1#0');
      expect(result).not.toContain('list-1#0');
      expect(result).toContain('list-1#1');
      expect(result).toHaveLength(1);
    });

    it('preserves order of remaining items', () => {
      const ids = ['list-1#0', 'list-1#1', 'list-1#2'];
      const result = toggleFavorite(ids, 'list-1#1');
      expect(result).toEqual(['list-1#0', 'list-1#2']);
    });

    it('returns new array (immutable)', () => {
      const ids = ['list-1#0'];
      const result = toggleFavorite(ids, 'list-1#1');
      expect(result).not.toBe(ids);
      expect(ids).toEqual(['list-1#0']); // Original unchanged
    });
  });

  describe('pushRecent', () => {
    it('adds placeId to front if not present', () => {
      const ids = ['list-1#1'];
      const result = pushRecent(ids, 'list-1#0', 20);
      expect(result[0]).toBe('list-1#0');
      expect(result).toContain('list-1#1');
    });

    it('moves placeId to front if present', () => {
      const ids = ['list-1#0', 'list-1#1', 'list-1#2'];
      const result = pushRecent(ids, 'list-1#1', 20);
      expect(result[0]).toBe('list-1#1');
      expect(result).toEqual(['list-1#1', 'list-1#0', 'list-1#2']);
    });

    it('truncates to max length', () => {
      const ids = ['a', 'b', 'c', 'd', 'e'];
      const result = pushRecent(ids, 'f', 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('f');
    });

    it('de-duplicates', () => {
      const ids = ['list-1#0', 'list-1#1'];
      const result = pushRecent(ids, 'list-1#0', 20);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('list-1#0');
    });

    it('returns new array (immutable)', () => {
      const ids = ['list-1#0'];
      const result = pushRecent(ids, 'list-1#1', 20);
      expect(result).not.toBe(ids);
      expect(ids).toEqual(['list-1#0']);
    });
  });

  describe('pruneUnknown', () => {
    it('removes ids for non-existent list slugs', () => {
      const ids = ['list-1#0', 'nonexistent#0'];
      const catalog = createMockCatalog();
      const result = pruneUnknown(ids, catalog);
      expect(result).toContain('list-1#0');
      expect(result).not.toContain('nonexistent#0');
    });

    it('removes ids with out-of-range indices', () => {
      const ids = ['list-1#0', 'list-1#99'];
      const catalog = createMockCatalog();
      const result = pruneUnknown(ids, catalog);
      expect(result).toContain('list-1#0');
      expect(result).not.toContain('list-1#99');
    });

    it('keeps valid ids', () => {
      const ids = ['list-1#0', 'list-1#1', 'list-1#2'];
      const catalog = createMockCatalog();
      const result = pruneUnknown(ids, catalog);
      expect(result).toEqual(ids);
    });

    it('returns new array (immutable)', () => {
      const ids = ['list-1#0'];
      const catalog = createMockCatalog();
      const result = pruneUnknown(ids, catalog);
      expect(result).not.toBe(ids);
    });

    it('handles malformed placeIds', () => {
      const ids = ['invalid-id', 'list-1#0'];
      const catalog = createMockCatalog();
      const result = pruneUnknown(ids, catalog);
      expect(result).toContain('list-1#0');
      expect(result).not.toContain('invalid-id');
    });
  });
});
