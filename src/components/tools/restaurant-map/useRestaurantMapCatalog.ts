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
  favorites: string[];
  recents: string[];
  toggleFavoriteFn: (placeId: string) => void;
  select: (placeId: string | null) => void;
  mounted: boolean;
  userGeo: { lat: number; lng: number } | null;
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
  mounted: boolean;
  userGeo: { lat: number; lng: number } | null;
}

type Action =
  | { type: 'SET_STORE'; payload: RestaurantMapStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_REGION'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_GEOLOCATION'; payload: { lat: number; lng: number } }
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
    mounted: false,
    userGeo: null,
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
        store: {
          ...state.store,
          userGeo: { ...action.payload, timestamp: Date.now() },
        },
      };
    case 'CLEAR_GEOLOCATION':
      return {
        ...state,
        userGeo: null,
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

  // Derived: filtered places (region + category + search)
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

    // Apply category filter
    if (state.activeCategory !== 'all') {
      places = places.filter((p) => p.category === state.activeCategory);
    }

    // Apply search filter
    places = filterPlaces(places, state.query, locale);

    return places;
  }, [state.catalog, state.activeRegion, state.activeCategory, state.query, locale, state.store]);

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

  const handleToggleFavorite = useCallback((placeId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: placeId });
  }, []);

  const handleSelect = useCallback((placeId: string | null) => {
    dispatch({ type: 'SELECT', payload: placeId });
  }, []);

  const handleRequestGeolocation = useCallback(async () => {
    if (!navigator.geolocation) return;
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
        () => {
          // User denied or error — silently fail
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
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavoriteFn: handleToggleFavorite,
    select: handleSelect,
    mounted: state.mounted,
    userGeo: state.userGeo,
    requestGeolocation: handleRequestGeolocation,
    clearGeolocation: handleClearGeolocation,
  };
}
