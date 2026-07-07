'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import {
  STORE_VERSION,
  HowtoStoreSchema,
  type HowtoStore,
  type MergedGuide,
  type TopicTab,
} from '@/lib/howto/schema';
import {
  byId,
  byTopic,
  topics as getTopics,
} from '@/lib/howto/catalog';
import { filterGuides } from '@/lib/howto/search';
import {
  toggleFavorite,
  pushRecent,
  pruneUnknown,
  RECENTS_MAX,
} from '@/lib/howto/favorites';

const STORAGE_KEY = 'jurepi-howto';
const SEARCH_DEBOUNCE = 120;

export interface UseHowtoReturn {
  catalog: MergedGuide[];
  filtered: MergedGuide[];
  selectedSlug: string | null;
  selectedGuide: MergedGuide | undefined;
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeTopic: TopicTab;
  setActiveTopic: (t: TopicTab) => void;
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  select: (slug: string | null) => void;
  topicsAvailable: string[];
}

interface State {
  catalog: MergedGuide[];
  store: HowtoStore;
  selectedSlug: string | null;
  query: string;
  queryDraft: string;
  activeTopic: TopicTab;
  mounted: boolean;
}

type Action =
  | { type: 'SET_CATALOG'; payload: MergedGuide[] }
  | { type: 'SET_STORE'; payload: HowtoStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_TOPIC'; payload: TopicTab }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SYNC_STORE'; payload: HowtoStore };

function initialState(catalog: MergedGuide[] = []): State {
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
    activeTopic: 'all',
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
    case 'SET_TOPIC':
      return { ...state, activeTopic: action.payload };
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

export function useHowto(initialCatalog: MergedGuide[] = []): UseHowtoReturn {
  const [state, dispatch] = useReducer(reducer, initialState(initialCatalog));

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load localStorage store against a known catalog, then mark mounted.
  const applyStore = useCallback((guides: MergedGuide[]) => {
    let store: HowtoStore;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = HowtoStoreSchema.safeParse(parsed);
        store = validated.success ? validated.data : initialState().store;
      } else {
        store = initialState().store;
      }
    } catch {
      store = initialState().store;
    }

    // Prune unknown slugs so a shrunken catalog never leaves dangling ids.
    store = {
      ...store,
      recents: pruneUnknown(store.recents, guides),
      favorites: pruneUnknown(store.favorites, guides),
    };

    dispatch({ type: 'SET_STORE', payload: store });
    dispatch({ type: 'SET_MOUNTED' });
  }, []);

  // Load catalog on mount. An injected catalog (tests / caller-provided) is
  // used synchronously; otherwise the generated catalog is code-split imported.
  useEffect(() => {
    if (initialCatalog.length > 0) {
      applyStore(initialCatalog);
      return;
    }

    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const mod = await import('./data/guides.generated.json');
        if (cancelled) return;
        const guides = (mod.default || mod) as MergedGuide[];
        dispatch({ type: 'SET_CATALOG', payload: guides });
        applyStore(guides);
      } catch {
        if (!cancelled) dispatch({ type: 'SET_MOUNTED' });
      }
    };
    loadCatalog();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyStore]);

  // Debounced query commit
  const commitQuery = useCallback((q: string) => {
    dispatch({ type: 'COMMIT_QUERY', payload: q });
  }, []);

  // Handle query draft + debounce
  const setQueryDraft = useCallback((q: string) => {
    dispatch({ type: 'SET_QUERY_DRAFT', payload: q });
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      commitQuery(q);
    }, SEARCH_DEBOUNCE);
  }, [commitQuery]);

  // Persist store to localStorage immediately
  const persistStore = useCallback((storeData: HowtoStore) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
    } catch {
      // Silent fail
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

    if (state.activeTopic !== 'all' && state.activeTopic !== 'favorites' && state.activeTopic !== 'recent') {
      result = byTopic(result, state.activeTopic);
    } else if (state.activeTopic === 'favorites') {
      result = result.filter((g) => state.store.favorites.includes(g.slug));
    } else if (state.activeTopic === 'recent') {
      result = state.store.recents
        .map((slug) => byId(state.catalog, slug))
        .filter((g) => g !== undefined) as MergedGuide[];
    }

    return filterGuides(result, state.query);
  }, [state.catalog, state.activeTopic, state.query, state.store.favorites, state.store.recents]);

  const selectedGuide = state.selectedSlug ? byId(state.catalog, state.selectedSlug) : undefined;
  const topicsAvailable = getTopics(state.catalog);

  return {
    catalog: state.catalog,
    filtered,
    selectedSlug: state.selectedSlug,
    selectedGuide,
    query: state.queryDraft,
    setQuery: setQueryDraft,
    resultCount: filtered.length,
    activeTopic: state.activeTopic,
    setActiveTopic: (t) => dispatch({ type: 'SET_TOPIC', payload: t }),
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavorite: (slug) => dispatch({ type: 'TOGGLE_FAVORITE', payload: slug }),
    select: (slug) => dispatch({ type: 'SELECT', payload: slug }),
    topicsAvailable,
  };
}
