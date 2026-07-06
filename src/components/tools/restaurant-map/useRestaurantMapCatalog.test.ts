import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { pruneUnknown, toggleFavorite, pushRecent } from '@/lib/restaurant-map/favorites';
import type { MergedPlaceList } from '@/lib/restaurant-map/schema';
import { useRestaurantMapCatalog } from './useRestaurantMapCatalog';
import { IntlProvider } from './test-utils';

// Minimal test fixture catalog
const createTestCatalog = (): MergedPlaceList[] => [
  {
    slug: 'test-list-1',
    region: 'seoul',
    curator: 'honey',
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

// ---------------------------------------------------------------------------
// Hook-level geolocation state machine + distance sorting (renderHook, real
// mount — no fake timers; geolocation flow does not depend on the search
// debounce). navigator.geolocation is mocked per-test via defineProperty.
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(IntlProvider, { locale: 'ko', children });

type GeoSuccess = (pos: { coords: { latitude: number; longitude: number } }) => void;
type GeoError = (err: { code: number }) => void;

function stubGeolocation(impl: ((success: GeoSuccess, error: GeoError) => void) | null) {
  const original = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
  Object.defineProperty(navigator, 'geolocation', {
    value: impl ? { getCurrentPosition: vi.fn(impl) } : undefined,
    configurable: true,
  });
  return () => {
    if (original) Object.defineProperty(navigator, 'geolocation', original);
    else delete (navigator as any).geolocation;
  };
}

describe('useRestaurantMapCatalog — geolocation state machine', () => {
  let catalog: MergedPlaceList[];
  let restoreGeo: (() => void) | null = null;

  beforeEach(() => {
    catalog = createTestCatalog();
    localStorage.clear();
  });

  afterEach(() => {
    restoreGeo?.();
    restoreGeo = null;
  });

  it('starts idle with no userGeo', async () => {
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.geoStatus).toBe('idle');
    expect(result.current.userGeo).toBeNull();
  });

  it('success: sets userGeo and geoStatus=active', async () => {
    restoreGeo = stubGeolocation((success) =>
      success({ coords: { latitude: 37.7, longitude: 127.2 } })
    );
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.requestGeolocation();
    });

    expect(result.current.userGeo).toEqual({ lat: 37.7, lng: 127.2 });
    expect(result.current.geoStatus).toBe('active');
  });

  it('exposes loading while the position request is pending', async () => {
    let pendingSuccess: GeoSuccess | null = null;
    restoreGeo = stubGeolocation((success) => {
      pendingSuccess = success;
    });
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    let request: Promise<void> | undefined;
    act(() => {
      request = result.current.requestGeolocation();
    });
    await waitFor(() => expect(result.current.geoStatus).toBe('loading'));

    await act(async () => {
      pendingSuccess?.({ coords: { latitude: 37.5, longitude: 127.0 } });
      await request;
    });
    expect(result.current.geoStatus).toBe('active');
  });

  it('permission denied (code 1): geoStatus=denied, userGeo stays null, promise resolves', async () => {
    restoreGeo = stubGeolocation((_success, error) => error({ code: 1 }));
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await expect(result.current.requestGeolocation()).resolves.toBeUndefined();
    });

    expect(result.current.geoStatus).toBe('denied');
    expect(result.current.userGeo).toBeNull();
  });

  it('position unavailable/timeout (code 2/3): geoStatus=error', async () => {
    restoreGeo = stubGeolocation((_success, error) => error({ code: 2 }));
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.requestGeolocation();
    });

    expect(result.current.geoStatus).toBe('error');
  });

  it('no navigator.geolocation: geoStatus=unsupported', async () => {
    restoreGeo = stubGeolocation(null);
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.requestGeolocation();
    });

    expect(result.current.geoStatus).toBe('unsupported');
  });

  it('clearGeolocation: back to idle, userGeo null, persisted store entry removed', async () => {
    restoreGeo = stubGeolocation((success) =>
      success({ coords: { latitude: 37.7, longitude: 127.2 } })
    );
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.requestGeolocation();
    });
    expect(result.current.geoStatus).toBe('active');

    act(() => {
      result.current.clearGeolocation();
    });

    expect(result.current.geoStatus).toBe('idle');
    expect(result.current.userGeo).toBeNull();
    const persisted = JSON.parse(localStorage.getItem('jurepi-restaurant-map') ?? '{}');
    expect(persisted.userGeo).toBeUndefined();
  });

  it('restores persisted fresh userGeo on mount with geoStatus=active', async () => {
    localStorage.setItem(
      'jurepi-restaurant-map',
      JSON.stringify({
        version: 1,
        favorites: [],
        recents: [],
        meta: { createdAt: Date.now() },
        userGeo: { lat: 37.6, lng: 127.1, timestamp: Date.now() },
      })
    );
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.userGeo).toEqual({ lat: 37.6, lng: 127.1 });
    expect(result.current.geoStatus).toBe('active');
  });
});

describe('useRestaurantMapCatalog — distance sorting', () => {
  let catalog: MergedPlaceList[];
  let restoreGeo: (() => void) | null = null;

  beforeEach(() => {
    catalog = createTestCatalog();
    localStorage.clear();
  });

  afterEach(() => {
    restoreGeo?.();
    restoreGeo = null;
  });

  it('keeps catalog order when no userGeo', async () => {
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual([
      'test-list-1#0',
      'test-list-1#1',
      'test-list-1#2',
    ]);
  });

  it('sorts nearest-first once userGeo is active (order inversion fixture)', async () => {
    // User stands at place C (37.7, 127.2) — farthest in catalog order —
    // so a correct sort must fully invert the list: C, B, A.
    restoreGeo = stubGeolocation((success) =>
      success({ coords: { latitude: 37.7, longitude: 127.2 } })
    );
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.requestGeolocation();
    });

    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual([
      'test-list-1#2',
      'test-list-1#1',
      'test-list-1#0',
    ]);
  });

  it('clearing geolocation restores catalog order', async () => {
    restoreGeo = stubGeolocation((success) =>
      success({ coords: { latitude: 37.7, longitude: 127.2 } })
    );
    const { result } = renderHook(() => useRestaurantMapCatalog(catalog), { wrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    await act(async () => {
      await result.current.requestGeolocation();
    });
    act(() => {
      result.current.clearGeolocation();
    });

    expect(result.current.filteredPlaces.map((p) => p.id)).toEqual([
      'test-list-1#0',
      'test-list-1#1',
      'test-list-1#2',
    ]);
  });
});
