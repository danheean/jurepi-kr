import { describe, it, expect } from 'vitest';
import {
  allPlaceLists,
  byId,
  byPlaceId,
  byRegion,
  regions,
  categories,
} from './catalog';
import type { MergedPlaceList } from './schema';

describe('catalog', () => {
  const createMockList = (overrides: Partial<MergedPlaceList> = {}): MergedPlaceList => ({
    slug: 'test-list',
    region: 'seoul',
    asOfDate: '2026-07-04',
    ko: {
      title: 'Test List KO',
      sourceNote: 'KO note',
      places: [
        {
          id: 'test-list#0',
          name: 'Place 1',
          lat: 37.5,
          lng: 127.0,
          category: 'cafe',
          address: 'Address 1',
          description: 'Desc 1',
          personalNote: 'Note 1',
        },
        {
          id: 'test-list#1',
          name: 'Place 2',
          lat: 37.6,
          lng: 127.1,
          category: 'korean',
          address: 'Address 2',
          description: 'Desc 2',
          personalNote: 'Note 2',
        },
      ],
    },
    en: {
      title: 'Test List EN',
      sourceNote: 'EN note',
      places: [
        {
          id: 'test-list#0',
          name: 'Place 1 EN',
          lat: 37.5,
          lng: 127.0,
          category: 'cafe',
          address: 'Address 1 EN',
          description: 'Desc 1 EN',
          personalNote: 'Note 1 EN',
        },
        {
          id: 'test-list#1',
          name: 'Place 2 EN',
          lat: 37.6,
          lng: 127.1,
          category: 'korean',
          address: 'Address 2 EN',
          description: 'Desc 2 EN',
          personalNote: 'Note 2 EN',
        },
      ],
    },
    ...overrides,
  });

  describe('byId', () => {
    it('returns list by slug', () => {
      const catalog = [createMockList({ slug: 'seoul-cafes' })];
      const result = byId(catalog, 'seoul-cafes');
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('seoul-cafes');
    });

    it('returns null for non-existent slug', () => {
      const catalog = [createMockList({ slug: 'seoul-cafes' })];
      const result = byId(catalog, 'busan-ramen');
      expect(result).toBeNull();
    });
  });

  describe('byPlaceId', () => {
    it('resolves placeId to place object in ko locale', () => {
      const catalog = [createMockList({ slug: 'test-list' })];
      const place = byPlaceId(catalog, 'test-list#0', 'ko');
      expect(place).not.toBeNull();
      expect(place?.name).toBe('Place 1');
    });

    it('resolves placeId to place object in en locale', () => {
      const catalog = [createMockList({ slug: 'test-list' })];
      const place = byPlaceId(catalog, 'test-list#0', 'en');
      expect(place).not.toBeNull();
      expect(place?.name).toBe('Place 1 EN');
    });

    it('returns null for invalid placeId format', () => {
      const catalog = [createMockList()];
      const place = byPlaceId(catalog, 'invalid-id', 'ko');
      expect(place).toBeNull();
    });

    it('returns null for non-existent list slug', () => {
      const catalog = [createMockList({ slug: 'test-list' })];
      const place = byPlaceId(catalog, 'nonexistent#0', 'ko');
      expect(place).toBeNull();
    });

    it('returns null for out-of-range index', () => {
      const catalog = [createMockList({ slug: 'test-list' })];
      const place = byPlaceId(catalog, 'test-list#99', 'ko');
      expect(place).toBeNull();
    });
  });

  describe('byRegion', () => {
    it('returns lists for specific region', () => {
      const catalog = [
        createMockList({ slug: 'seoul-1', region: 'seoul' }),
        createMockList({ slug: 'seoul-2', region: 'seoul' }),
        createMockList({ slug: 'busan-1', region: 'busan' }),
      ];
      const result = byRegion(catalog, 'seoul');
      expect(result).toHaveLength(2);
      expect(result.map((l) => l.slug)).toEqual(['seoul-1', 'seoul-2']);
    });

    it('returns empty array for region with no lists', () => {
      const catalog = [createMockList({ region: 'seoul' })];
      const result = byRegion(catalog, 'busan');
      expect(result).toHaveLength(0);
    });
  });

  describe('regions', () => {
    it('returns unique regions from catalog', () => {
      const catalog = [
        createMockList({ slug: 'list-1', region: 'seoul' }),
        createMockList({ slug: 'list-2', region: 'seoul' }),
        createMockList({ slug: 'list-3', region: 'busan' }),
        createMockList({ slug: 'list-4', region: 'nationwide' }),
      ];
      const result = regions(catalog);
      expect(result).toContain('seoul');
      expect(result).toContain('busan');
      expect(result).toContain('nationwide');
      expect(result).toHaveLength(3);
    });

    it('returns empty array for empty catalog', () => {
      const result = regions([]);
      expect(result).toEqual([]);
    });
  });

  describe('categories', () => {
    it('returns unique categories from all places', () => {
      const catalog = [
        createMockList({
          slug: 'list-1',
          ko: {
            ...createMockList().ko,
            places: [
              {
                id: 'list-1#0',
                name: 'Cafe',
                lat: 37.5,
                lng: 127.0,
                category: 'cafe',
                address: 'Address',
                description: 'Desc',
                personalNote: 'Note',
              },
              {
                id: 'list-1#1',
                name: 'Korean',
                lat: 37.6,
                lng: 127.1,
                category: 'korean',
                address: 'Address',
                description: 'Desc',
                personalNote: 'Note',
              },
            ],
          },
        }),
        createMockList({
          slug: 'list-2',
          ko: {
            ...createMockList().ko,
            places: [
              {
                id: 'list-2#0',
                name: 'Japanese',
                lat: 37.5,
                lng: 127.0,
                category: 'japanese',
                address: 'Address',
                description: 'Desc',
                personalNote: 'Note',
              },
            ],
          },
        }),
      ];
      const result = categories(catalog);
      expect(result).toContain('cafe');
      expect(result).toContain('korean');
      expect(result).toContain('japanese');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('allPlaceLists', () => {
    it('returns all lists in order', () => {
      const list1 = createMockList({ slug: 'list-1' });
      const list2 = createMockList({ slug: 'list-2' });
      const catalog = [list1, list2];
      const result = allPlaceLists(catalog);
      expect(result).toEqual(catalog);
    });

    it('returns empty array for empty input', () => {
      const result = allPlaceLists([]);
      expect(result).toEqual([]);
    });
  });
});
