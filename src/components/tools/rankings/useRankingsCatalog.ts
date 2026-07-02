'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  STORE_VERSION,
  RankingsStoreSchema,
  type RankingsStore,
  type MergedRanking,
} from '@/lib/rankings/schema';
import { byId, byField, fields as getFields } from '@/lib/rankings/catalog';
import { filterRankings } from '@/lib/rankings/search';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from '@/lib/rankings/favorites';

const STORAGE_KEY = 'jurepi-rankings';
const SEARCH_DEBOUNCE = 120;

export interface UseRankingsCatalogReturn {
  catalog: MergedRanking[];
  filtered: MergedRanking[];
  selectedSlug: string | null;
  selectedRanking: MergedRanking | null;
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeField: 'all' | string | 'favorites' | 'recent';
  setActiveField: (f: 'all' | string | 'favorites' | 'recent') => void;
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  select: (slug: string | null) => void;
  copy: (text: string) => Promise<boolean>;
  fieldsAvailable: string[];
}

interface State {
  catalog: MergedRanking[];
  store: RankingsStore;
  selectedSlug: string | null;
  query: string;
  queryDraft: string;
  activeField: 'all' | string | 'favorites' | 'recent';
  mounted: boolean;
}

type Action =
  | { type: 'SET_CATALOG'; payload: MergedRanking[] }
  | { type: 'SET_STORE'; payload: RankingsStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_FIELD'; payload: 'all' | string | 'favorites' | 'recent' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SYNC_STORE'; payload: RankingsStore };

function initialState(catalog: MergedRanking[] = []): State {
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
    activeField: 'all',
    mounted: false,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CATALOG':
      return { ...state, catalog: action.payload };
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
      return { ...state, selectedSlug: action.payload, store: newStore };
    }
    case 'SET_FIELD':
      return { ...state, activeField: action.payload };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        store: {
          ...state.store,
          favorites: toggleFavorite(state.store.favorites, action.payload),
        },
      };
    case 'SYNC_STORE':
      return { ...state, store: action.payload };
    default:
      return state;
  }
}

export function useRankingsCatalog(initialCatalog: MergedRanking[] = []): UseRankingsCatalogReturn {
  const locale = useLocale() as 'ko' | 'en';
  const [state, dispatch] = useReducer(reducer, initialState(initialCatalog));

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load catalog on mount (dynamic import for code-split)
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const module = await import('./data/rankings.generated.json');
        const rankings = (module.default || module) as MergedRanking[];
        dispatch({ type: 'SET_CATALOG', payload: rankings });

        // Load localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        let store: RankingsStore;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const validated = RankingsStoreSchema.safeParse(parsed);
            store = validated.success ? validated.data : initialState().store;
          } catch {
            store = initialState().store;
          }
        } else {
          store = initialState().store;
        }

        // Prune unknown slugs
        store.recents = pruneUnknown(store.recents, rankings);
        store.favorites = pruneUnknown(store.favorites, rankings);

        dispatch({ type: 'SET_STORE', payload: store });
        dispatch({ type: 'SET_MOUNTED' });
      } catch (e) {
        // Fallback: catalog load failure, empty catalog in-memory
        dispatch({ type: 'SET_MOUNTED' });
      }
    };

    loadCatalog();
  }, []);

  // Debounced query commit (stale closure fix)
  const commitQuery = useCallback((q: string) => {
    dispatch({ type: 'COMMIT_QUERY', payload: q });
  }, []);

  // Handle query draft + debounce
  const setQueryDraft = useCallback(
    (q: string) => {
      dispatch({ type: 'SET_QUERY_DRAFT', payload: q });
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        commitQuery(q);
      }, SEARCH_DEBOUNCE);
    },
    [commitQuery]
  );

  // Persist store to localStorage immediately
  const persistStore = useCallback((storeData: RankingsStore) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
    } catch {
      // Silent fail: quota exceeded or security error → keep in-memory.
    }
  }, []);

  // Persist when store changes
  useEffect(() => {
    if (state.mounted) {
      persistStore(state.store);
    }
  }, [state.store, state.mounted, persistStore]);

  // Compute filtered list
  const filtered = useMemo(() => {
    let result = state.catalog;

    if (state.activeField === 'favorites') {
      result = result.filter((r) => state.store.favorites.includes(r.slug));
    } else if (state.activeField === 'recent') {
      result = state.store.recents
        .map((slug) => byId(state.catalog, slug))
        .filter((r) => r !== null) as MergedRanking[];
    } else if (state.activeField !== 'all') {
      result = byField(result, state.activeField);
    }

    return filterRankings(result, state.query);
  }, [state.catalog, state.activeField, state.query, state.store.favorites, state.store.recents]);

  const selectedRanking = state.selectedSlug ? byId(state.catalog, state.selectedSlug) : null;
  const fieldsAvailable = getFields(state.catalog);

  // Copy to clipboard with fallback
  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback: hidden textarea
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  return {
    catalog: state.catalog,
    filtered,
    selectedSlug: state.selectedSlug,
    selectedRanking,
    query: state.queryDraft,
    setQuery: setQueryDraft,
    resultCount: filtered.length,
    activeField: state.activeField,
    setActiveField: (f) => dispatch({ type: 'SET_FIELD', payload: f }),
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavorite: (slug) => dispatch({ type: 'TOGGLE_FAVORITE', payload: slug }),
    select: (slug) => dispatch({ type: 'SELECT', payload: slug }),
    copy,
    fieldsAvailable,
  };
}
