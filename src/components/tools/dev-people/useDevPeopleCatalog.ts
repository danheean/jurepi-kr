'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import {
  STORE_VERSION,
  RECENTS_MAX,
  DevPeopleStoreSchema,
  type DevPeopleStore,
  type MergedPerson,
} from '@/lib/dev-people/schema';
import { filterPeople } from '@/lib/dev-people/search';
import { toggleFavorite, pushRecent, pruneUnknown } from '@/lib/dev-people/favorites';
import { byId, peoples } from '@/lib/dev-people/catalog';

const STORAGE_KEY = 'jurepi-dev-people';
const SEARCH_DEBOUNCE = 120;

export type Era = '1940-1960' | '1960-1980' | '1980-2000' | '2000-present';
export type Tag = string;

export interface UseDevPeopleCatalogReturn {
  catalog: MergedPerson[];
  filtered: MergedPerson[];
  selectedSlug: string | null;
  selectedPerson: MergedPerson | null;
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  selectedTag: Tag | undefined;
  setTag: (tag: Tag | undefined) => void;
  selectedEra: Era | undefined;
  setEra: (era: Era | undefined) => void;
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  pushRecent: (slug: string) => void;
  select: (slug: string | null) => void;
}

interface State {
  catalog: MergedPerson[];
  store: DevPeopleStore;
  selectedSlug: string | null;
  query: string;
  queryDraft: string;
  selectedTag: Tag | undefined;
  selectedEra: Era | undefined;
  mounted: boolean;
}

type Action =
  | { type: 'SET_STORE'; payload: DevPeopleStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_TAG'; payload: Tag | undefined }
  | { type: 'SET_ERA'; payload: Era | undefined }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'PUSH_RECENT'; payload: string }
  | { type: 'SYNC_STORE'; payload: DevPeopleStore };

function initialState(catalog: MergedPerson[] = []): State {
  return {
    catalog,
    store: {
      version: STORE_VERSION,
      favorites: [],
      recents: [],
      meta: { createdAt: Date.now() },
    },
    selectedSlug: null,
    query: '',
    queryDraft: '',
    selectedTag: undefined,
    selectedEra: undefined,
    mounted: false,
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
    case 'SELECT':
      return { ...state, selectedSlug: action.payload };
    case 'SET_TAG':
      return { ...state, selectedTag: action.payload };
    case 'SET_ERA':
      return { ...state, selectedEra: action.payload };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        store: {
          ...state.store,
          favorites: toggleFavorite(state.store.favorites, action.payload),
        },
      };
    case 'PUSH_RECENT':
      return {
        ...state,
        store: {
          ...state.store,
          recents: pushRecent(state.store.recents, action.payload, RECENTS_MAX),
        },
      };
    case 'SYNC_STORE':
      return { ...state, store: action.payload };
    default:
      return state;
  }
}

export function useDevPeopleCatalog(catalog: MergedPerson[]): UseDevPeopleCatalogReturn {
  const [state, dispatch] = useReducer(reducer, { catalog }, (init) => initialState(init.catalog));
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Mount: read localStorage, parse, prune unknown slugs
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = DevPeopleStoreSchema.safeParse(parsed);
        if (validated.success) {
          // Prune unknown slugs from favorites and recents
          const validSlugs = peoples(catalog);
          const pruned = {
            ...validated.data,
            favorites: pruneUnknown(validated.data.favorites, validSlugs),
            recents: pruneUnknown(validated.data.recents, validSlugs),
          };
          dispatch({ type: 'SET_STORE', payload: pruned });
        } else {
          // Validation failed, start fresh
          const freshState = initialState();
          dispatch({ type: 'SET_STORE', payload: freshState.store });
        }
      }
    } catch {
      // Storage unavailable or parse error, start fresh (no throw)
    }
    dispatch({ type: 'SET_MOUNTED' });
  }, [catalog]);

  // Persist store to localStorage when it changes (debounced)
  useEffect(() => {
    if (!state.mounted) return;

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
      } catch {
        // Storage quota exceeded or unavailable, keep in-memory (no throw)
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [state.store, state.mounted]);

  // Query debounce: commit queryDraft after SEARCH_DEBOUNCE
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      dispatch({ type: 'COMMIT_QUERY', payload: state.queryDraft });
    }, SEARCH_DEBOUNCE);

    return () => clearTimeout(debounceTimer.current);
  }, [state.queryDraft]);

  // Compute filtered list based on query, tag, era, and active tab
  const filtered = useMemo(() => {
    let result = state.catalog;

    // Apply tag and era filters
    result = filterPeople(
      result,
      state.query,
      state.selectedTag as any,
      state.selectedEra
    );

    return result;
  }, [state.catalog, state.query, state.selectedTag, state.selectedEra]);

  const selectedPerson = state.selectedSlug ? byId(state.catalog, state.selectedSlug) ?? null : null;

  const handleSetQuery = useCallback((q: string) => {
    dispatch({ type: 'SET_QUERY_DRAFT', payload: q });
  }, []);

  const handleSetTag = useCallback((tag: Tag | string | undefined) => {
    dispatch({ type: 'SET_TAG', payload: tag as Tag | undefined });
  }, []);

  const handleSetEra = useCallback((era: Era | string | undefined) => {
    dispatch({ type: 'SET_ERA', payload: era as Era | undefined });
  }, []);

  const handleToggleFavorite = useCallback((slug: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: slug });
  }, []);

  const handlePushRecent = useCallback((slug: string) => {
    dispatch({ type: 'PUSH_RECENT', payload: slug });
  }, []);

  const handleSelect = useCallback((slug: string | null) => {
    if (slug) {
      handlePushRecent(slug);
    }
    dispatch({ type: 'SELECT', payload: slug });
  }, [handlePushRecent]);

  return {
    catalog: state.catalog,
    filtered,
    selectedSlug: state.selectedSlug,
    selectedPerson,
    query: state.query,
    setQuery: handleSetQuery,
    resultCount: filtered.length,
    selectedTag: state.selectedTag,
    setTag: handleSetTag,
    selectedEra: state.selectedEra,
    setEra: handleSetEra,
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavorite: handleToggleFavorite,
    pushRecent: handlePushRecent,
    select: handleSelect,
  };
}
