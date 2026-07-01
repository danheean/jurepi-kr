'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  STORE_VERSION,
  GlossaryStoreSchema,
  type GlossaryStore,
  type MergedTerm,
} from '@/lib/new-word/schema';
import {
  byId,
  byTopic,
  topics as getTopics,
} from '@/lib/new-word/catalog';
import { filterTerms } from '@/lib/new-word/search';
import {
  toggleFavorite,
  pushRecent,
  pruneUnknown,
  RECENTS_MAX,
} from '@/lib/new-word/favorites';

const STORAGE_KEY = 'jurepi-new-word';
const SEARCH_DEBOUNCE = 120;

export interface UseGlossaryReturn {
  catalog: MergedTerm[];
  filtered: MergedTerm[];
  selectedSlug: string | null;
  selectedTerm: MergedTerm | null;
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeTopic: 'all' | 'mz' | 'tech' | 'favorites' | 'recent';
  setActiveTopic: (t: 'all' | 'mz' | 'tech' | 'favorites' | 'recent') => void;
  displayLang: 'ko' | 'en' | 'both';
  setDisplayLang: (l: 'ko' | 'en' | 'both') => void;
  favorites: string[];
  recents: string[];
  toggleFavorite: (slug: string) => void;
  select: (slug: string | null) => void;
  copy: (text: string) => Promise<boolean>;
  topicsAvailable: string[];
}

interface State {
  catalog: MergedTerm[];
  store: GlossaryStore;
  selectedSlug: string | null;
  query: string;
  queryDraft: string;
  activeTopic: UseGlossaryReturn['activeTopic'];
  displayLang: 'ko' | 'en' | 'both';
  mounted: boolean;
}

type Action =
  | { type: 'SET_CATALOG'; payload: MergedTerm[] }
  | { type: 'SET_STORE'; payload: GlossaryStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'SET_TOPIC'; payload: UseGlossaryReturn['activeTopic'] }
  | { type: 'SET_LANG'; payload: 'ko' | 'en' | 'both' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SYNC_STORE'; payload: GlossaryStore };

function initialState(catalog: MergedTerm[] = []): State {
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
    displayLang: 'both',
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
    case 'SET_LANG':
      return {
        ...state,
        displayLang: action.payload,
        store: { ...state.store, meta: { ...state.store.meta, lastLang: action.payload } },
      };
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

export function useGlossary(initialCatalog: MergedTerm[] = []): UseGlossaryReturn {
  const locale = useLocale() as 'ko' | 'en';
  const [state, dispatch] = useReducer(reducer, initialState(initialCatalog));

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load catalog on mount
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const module = await import('./data/terms.generated.json');
        const terms = (module.default || module) as MergedTerm[];
        dispatch({ type: 'SET_CATALOG', payload: terms });

        // Load localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        let store: GlossaryStore;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const validated = GlossaryStoreSchema.safeParse(parsed);
            store = validated.success ? validated.data : initialState().store;
          } catch {
            store = initialState().store;
          }
        } else {
          store = initialState().store;
        }

        // Prune unknown slugs
        store.recents = pruneUnknown(store.recents, terms);
        store.favorites = pruneUnknown(store.favorites, terms);

        dispatch({ type: 'SET_STORE', payload: store });
        dispatch({ type: 'SET_MOUNTED' });
      } catch (e) {
        // Fallback: catalog load failure, empty catalog in-memory
        dispatch({ type: 'SET_MOUNTED' });
      }
    };

    loadCatalog();
  }, []);

  // Debounced query commit (stale closure fix: use callback that takes current query)
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

  // Persist store to localStorage immediately. Favorites/recents are tiny and
  // change only on discrete user actions (star, select, lang toggle), so an
  // eager write is safe and avoids losing a star when the user navigates away
  // within a debounce window (repo persistence lesson). Value is passed as an
  // argument (not closed over) to avoid stale-closure writes.
  const persistStore = useCallback((storeData: GlossaryStore) => {
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

    if (state.activeTopic === 'mz') {
      result = byTopic(result, 'mz');
    } else if (state.activeTopic === 'tech') {
      result = byTopic(result, 'tech');
    } else if (state.activeTopic === 'favorites') {
      result = result.filter((t) => state.store.favorites.includes(t.slug));
    } else if (state.activeTopic === 'recent') {
      result = state.store.recents
        .map((slug) => byId(state.catalog, slug))
        .filter((t) => t !== null) as MergedTerm[];
    }

    return filterTerms(result, state.query);
  }, [state.catalog, state.activeTopic, state.query, state.store.favorites, state.store.recents]);

  const selectedTerm = state.selectedSlug ? byId(state.catalog, state.selectedSlug) : null;
  const topicsAvailable = getTopics(state.catalog);

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
    selectedTerm,
    // Expose the DRAFT for the controlled input so typing is instant; filtering
    // below uses the debounced committed `state.query`. Binding the input to the
    // committed value made keystrokes lag ~120ms and drop characters.
    query: state.queryDraft,
    setQuery: setQueryDraft,
    resultCount: filtered.length,
    activeTopic: state.activeTopic,
    setActiveTopic: (t) => dispatch({ type: 'SET_TOPIC', payload: t }),
    displayLang: state.displayLang,
    setDisplayLang: (l) => dispatch({ type: 'SET_LANG', payload: l }),
    favorites: state.store.favorites,
    recents: state.store.recents,
    toggleFavorite: (slug) => dispatch({ type: 'TOGGLE_FAVORITE', payload: slug }),
    select: (slug) => dispatch({ type: 'SELECT', payload: slug }),
    copy,
    topicsAvailable,
  };
}
