import { describe, it, expect, beforeEach } from 'vitest';
import { pruneUnknown, toggleFavorite, pushRecent } from '@/lib/restaurant-map/favorites';
import type { MergedPlaceList } from '@/lib/restaurant-map/schema';

// Minimal test fixture catalog
const createTestCatalog = (): MergedPlaceList[] => [
  {
    slug: 'test-list-1',
    region: 'seoul',
    city: 'Seoul',
    asOfDate: '2024-01-01',
    sourceUrl: 'https://example.com',
    ko: {
      title: '서울 카페',
      sourceNote: 'Test source',
      places: [
        {
          id: 'test-list-1#0',
          name: '카페 A',
          lat: 37.5,
          lng: 127.0,
          category: 'cafe',
          address: '서울시 강남구',
          description: 'Best cafe',
          personalNote: '분위기 좋음',
        },
        {
          id: 'test-list-1#1',
          name: '카페 B',
          lat: 37.6,
          lng: 127.1,
          category: 'cafe',
          address: '서울시 서초구',
          description: 'Cozy cafe',
          personalNote: '조용함',
        },
        {
          id: 'test-list-1#2',
          name: '카페 C',
          lat: 37.7,
          lng: 127.2,
          category: 'korean',
          address: '서울시 마포구',
          description: 'Traditional cafe',
          personalNote: '한옥',
        },
      ],
    },
    en: {
      title: 'Seoul Cafes',
      sourceNote: 'Test source',
      places: [
        {
          id: 'test-list-1#0',
          name: 'Cafe A',
          lat: 37.5,
          lng: 127.0,
          category: 'cafe',
          address: 'Gangnam, Seoul',
          description: 'Best cafe',
          personalNote: 'Great vibe',
        },
        {
          id: 'test-list-1#1',
          name: 'Cafe B',
          lat: 37.6,
          lng: 127.1,
          category: 'cafe',
          address: 'Seocho, Seoul',
          description: 'Cozy cafe',
          personalNote: 'Quiet',
        },
        {
          id: 'test-list-1#2',
          name: 'Cafe C',
          lat: 37.7,
          lng: 127.2,
          category: 'korean',
          address: 'Mapo, Seoul',
          description: 'Traditional cafe',
          personalNote: 'Hanok style',
        },
      ],
    },
  },
];

describe('useRestaurantMapCatalog (integration)', () => {
  let catalog: MergedPlaceList[];

  beforeEach(() => {
    catalog = createTestCatalog();
    localStorage.clear();
  });

  it('catalog fixture has 3 places with correct ids', () => {
    expect(catalog[0]?.ko.places).toHaveLength(3);
    expect(catalog[0]?.ko.places[0]?.id).toBe('test-list-1#0');
    expect(catalog[0]?.ko.places[1]?.id).toBe('test-list-1#1');
    expect(catalog[0]?.ko.places[2]?.id).toBe('test-list-1#2');
  });

  it('pruneUnknown removes invalid placeIds from storage', () => {
    const favorites = ['test-list-1#0', 'test-list-1#1', 'invalid-list#999'];
    const pruned = pruneUnknown(favorites, catalog);

    expect(pruned).toEqual(['test-list-1#0', 'test-list-1#1']);
  });

  it('pruneUnknown keeps all valid placeIds', () => {
    const favorites = ['test-list-1#0', 'test-list-1#2'];
    const pruned = pruneUnknown(favorites, catalog);

    expect(pruned).toEqual(['test-list-1#0', 'test-list-1#2']);
  });

  it('toggleFavorite adds placeId to empty list', () => {
    const favorites: string[] = [];
    const updated = toggleFavorite(favorites, 'test-list-1#0');

    expect(updated).toEqual(['test-list-1#0']);
  });

  it('toggleFavorite removes placeId if already favorited', () => {
    const favorites = ['test-list-1#0', 'test-list-1#1'];
    const updated = toggleFavorite(favorites, 'test-list-1#0');

    expect(updated).toEqual(['test-list-1#1']);
  });

  it('toggleFavorite adds new placeId to existing favorites', () => {
    const favorites = ['test-list-1#0'];
    const updated = toggleFavorite(favorites, 'test-list-1#1');

    expect(updated).toEqual(['test-list-1#0', 'test-list-1#1']);
  });

  it('pushRecent adds placeId to front of list', () => {
    const recents: string[] = [];
    const updated = pushRecent(recents, 'test-list-1#0', 20);

    expect(updated[0]).toBe('test-list-1#0');
  });

  it('pushRecent deduplicates and maintains MRU order', () => {
    let recents = ['test-list-1#0'];
    recents = pushRecent(recents, 'test-list-1#1', 20);
    recents = pushRecent(recents, 'test-list-1#0', 20);

    // Most recent should be at front
    expect(recents[0]).toBe('test-list-1#0');
    expect(recents[1]).toBe('test-list-1#1');
    expect(recents).toHaveLength(2);
  });

  it('pushRecent respects max length truncation', () => {
    let recents: string[] = [];
    for (let i = 0; i < 25; i++) {
      recents = pushRecent(recents, `id${i}`, 20);
    }

    expect(recents).toHaveLength(20);
  });
});
