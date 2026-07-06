'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  STORE_VERSION,
  RestaurantMapStoreSchema,
  type RestaurantMapStore,
  type MergedPlaceList,
  type Place,
} from '@/lib/restaurant-map/schema';
import { filterPlaces } from '@/lib/restaurant-map/search';
import { haversineDistance } from '@/lib/restaurant-map/geo';
import {
  toggleFavorite,
  pushRecent,
  pruneUnknown,
} from '@/lib/restaurant-map/favorites';

const RECENTS_MAX = 20;
import { byPlaceId } from '@/lib/restaurant-map/catalog';

const STORAGE_KEY = 'jurepi-restaurant-map';
const SEARCH_DEBOUNCE = 120;
const GEOLOCATION_STALE_MS = 1 * 60 * 60 * 1000; // 1 hour

/**
 * Geolocation lifecycle. The request promise always resolves (never rejects) —
 * consumers read the outcome from this status instead of a thrown error.
 */
export type GeoStatus = 'idle' | 'loading' | 'active' | 'denied' | 'error' | 'unsupported';

export interface UseRestaurantMapCatalogReturn {
  catalog: MergedPlaceList[];
  filteredPlaces: Place[];
  selectedPlaceId: string | null;
  selectedPlace: Place | null;
  query: string;
  queryDraft: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeRegion: string;
  setActiveRegion: (region: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  activeCurator: string;
  setActiveCurator: (curator: string) => void;
  favorites: string[];
  recents: string[];
  toggleFavoriteFn: (placeId: string) => void;
  select: (placeId: string | null) => void;
  mounted: boolean;
  userGeo: { lat: number; lng: number } | null;
  geoStatus: GeoStatus;
  requestGeolocation: () => Promise<void>;
  clearGeolocation: () => void;
}

interface State {
  catalog: MergedPlaceList[];
  store: RestaurantMapStore;
  selectedPlaceId: string | null;
  query: string;
  queryDraft: string;
  activeRegion: string;
  activeCategory: string;
  activeCurator: string;
  mounted: boolean;
  userGeo: { lat: number; lng: number } | null;
  geoStatus: GeoStatus;
}

type Action =
  | { type: 'SET_STORE'; payload: RestaurantMapStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_REGION'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_CURATOR'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_GEOLOCATION'; payload: { lat: number; lng: number } }
  | { type: 'SET_GEO_STATUS'; payload: GeoStatus }
  | { type: 'CLEAR_GEOLOCATION' }
  | { type: 'SYNC_STORE'; payload: RestaurantMapStore };

function initialState(catalog: MergedPlaceList[] = []): State {
  return {
    catalog,
    store: {
      version: STORE_VERSION,
      favorites: [],
      recents: [],
      meta: { createdAt: Date.now() },
    },
    selectedPlaceId: null,
    query: '',
    queryDraft: '',
    activeRegion: 'all',
    activeCategory: 'all',
    activeCurator: 'all',
    mounted: false,
    userGeo: null,
    geoStatus: 'idle',
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_STORE':
      return { ...state, store: action.payload };
    case 'SET_MOUNTED':
      return { ...state, mounted: true };
    case 'SET_QUERY_DRAFT':
      return { ...state, queryDraft: action.payload };
    case 'COMMIT_QUERY':
      return { ...state, query: action.payload };
    case 'SELECT': {
      const newStore = { ...state.store };
      if (action.payload) {
        newStore.recents = pushRecent(state.store.recents, action.payload, RECENTS_MAX);
      }
      return { ...state, selectedPlaceId: action.payload, store: newStore };
    }
    case 'SET_REGION':
      return { ...state, activeRegion: action.payload };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.payload };
    case 'SET_CURATOR':
      return { ...state, activeCurator: action.payload };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        store: {
          ...state.store,
          favorites: toggleFavorite(state.store.favorites, action.payload),
        },
      };
    case 'SET_GEOLOCATION':
      return {
        ...state,
        userGeo: action.payload,
        geoStatus: 'active',
        store: {
          ...state.store,
          userGeo: { ...action.payload, timestamp: Date.now() },
        },
      };
    case 'SET_GEO_STATUS':
      return { ...state, geoStatus: action.payload };
    case 'CLEAR_GEOLOCATION':
      return {
        ...state,
        userGeo: null,
        geoStatus: 'idle',
        store: {
          ...state.store,
          userGeo: undefined,
        },
      };
    case 'SYNC_STORE':
      return { ...state, store: action.payload };
    default:
      return state;
  }
}

export function useRestaurantMapCatalog(
  catalog: MergedPlaceList[]
): UseRestaurantMapCatalogReturn {
  const locale = useLocale() as 'ko' | 'en';
  const initialCatalogState = initialState(catalog);
  const [state, dispatch] = useReducer(reducer, initialCatalogState);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = RestaurantMapStoreSchema.parse(parsed);
        const pruned = {
          ...validated,
          favorites: pruneUnknown(validated.favorites, catalog),
          recents: pruneUnknown(validated.recents, catalog),
        };
        dispatch({ type: 'SET_STORE', payload: pruned });
        if (pruned.userGeo && Date.now() - pruned.userGeo.timestamp < GEOLOCATION_STALE_MS) {
          dispatch({
            type: 'SET_GEOLOCATION',
            payload: { lat: pruned.userGeo.lat, lng: pruned.userGeo.lng },
          });
        }
      }
    } catch {
      // Corrupted/invalid — start fresh
    }
    dispatch({ type: 'SET_MOUNTED' });
  }, [catalog]);

  // Persist store to localStorage (debounced)
  useEffect(() => {
    if (!state.mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
    } catch {
      // Quota exceeded or private mode — keep in-memory
    }
  }, [state.store, state.mounted]);

  // Debounced search commit
  useEffect(() => {
    if (!state.mounted) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch({ type: 'COMMIT_QUERY', payload: state.queryDraft });
    }, SEARCH_DEBOUNCE);
    return () => clearTimeout(debounceRef.current);
  }, [state.queryDraft, state.mounted]);

  // Derived: filtered places (region + curator + category + search)
  const filteredPlaces = useMemo(() => {
    let places: Place[] = [];

    if (state.activeRegion === 'favorites') {
      places = state.store.favorites
        .map((placeId) => byPlaceId(state.catalog, placeId, locale))
        .filter((p): p is Place => p !== null);
    } else if (state.activeRegion === 'recent') {
      places = state.store.recents
        .map((placeId) => byPlaceId(state.catalog, placeId, locale))
        .filter((p): p is Place => p !== null);
    } else {
      // Collect places from all lists in active region (or all if region=all)
      const regionLists =
        state.activeRegion === 'all'
          ? state.catalog
          : state.catalog.filter((list) => list.region === state.activeRegion);

      places = regionLists.flatMap((list) => list[locale].places);
    }

    // Apply curator filter
    if (state.activeCurator !== 'all') {
      places = places.filter((p) => p.curator === state.activeCurator);
    }

    // Apply category filter
    if (state.activeCategory !== 'all') {
      places = places.filter((p) => p.category === state.activeCategory);
    }

    // Apply search filter
    places = filterPlaces(places, state.query, locale);

    // With an active user location, nearest places come first (immutable sort)
    const geo = state.userGeo;
    if (geo) {
      places = [...places].sort(
        (a, b) =>
          haversineDistance(geo.lat, geo.lng, a.lat, a.lng) -
          haversineDistance(geo.lat, geo.lng, b.lat, b.lng)
      );
    }

    return places;
  }, [state.catalog, state.activeRegion, state.activeCurator, state.activeCategory, state.query, locale, state.store, state.userGeo]);

  const selectedPlace = useMemo(() => {
    if (!state.selectedPlaceId) return null;
    return byPlaceId(state.catalog, state.selectedPlaceId, locale);
  }, [state.selectedPlaceId, state.catalog, locale]);

  const handleSetQuery = useCallback((q: string) => {
    dispatch({ type: 'SET_QUERY_DRAFT', payload: q });
  }, []);

  const handleSetActiveRegion = useCallback((region: string) => {
    dispatch({ type: 'SET_REGION', payload: region });
  }, []);

  const handleSetActiveCategory = useCallback((category: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  }, []);

  const handleSetActiveCurator = useCallback((curator: string) => {
    dispatch({ type: 'SET_CURATOR', payload: curator });
  }, []);

  const handleToggleFavorite = useCallback((placeId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: placeId });
  }, []);

  const handleSelect = useCallback((placeId: string | null) => {
    dispatch({ type: 'SELECT', payload: placeId });
  }, []);

  const handleRequestGeolocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      dispatch({ type: 'SET_GEO_STATUS', payload: 'unsupported' });
      return;
    }
    dispatch({ type: 'SET_GEO_STATUS', payload: 'loading' });
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch({
            type: 'SET_GEOLOCATION',
            payload: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          resolve();
        },
        (err) => {
          // Never rejects — outcome is exposed via geoStatus (1 = PERMISSION_DENIED)
          dispatch({
            type: 'SET_GEO_STATUS',
            payload: err?.code === 1 ? 'denied' : 'error',
          });
          resolve();
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }, []);

  const handleClearGeolocation = useCallback(() => {
    dispatch({ type: 'CLEAR_GEOLOCATION' });
  }, []);

  return {
    catalog: state.catalog,
    filteredPlaces,
    selectedPlaceId: state.selectedPlaceId,
    selectedPlace,
    query: state.query,
    queryDraft: state.queryDraft,
    setQuery: handleSetQuery,
    resultCount: filteredPlaces.length,
    activeRegion: state.activeRegion,
    setActiveRegion: handleSetActiveRegion,
    activeCategory: state.activeCategory,
    setActiveCategory: handleSetActiveCategory,
    activeCurator: state.activeCurator,
    setActiveCurator: handleSetActiveCurator,
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavoriteFn: handleToggleFavorite,
    select: handleSelect,
    mounted: state.mounted,
    userGeo: state.userGeo,
    geoStatus: state.geoStatus,
    requestGeolocation: handleRequestGeolocation,
    clearGeolocation: handleClearGeolocation,
  };
}
