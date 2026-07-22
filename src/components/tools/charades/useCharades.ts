'use client';

import { useEffect, useReducer, useRef, useCallback, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  STORE_VERSION,
  CharadesStoreSchema,
  type CharadesStore,
  type MergedDeck,
} from '@/lib/charades/schema';
import { pushRecent, pruneUnknown, RECENTS_MAX } from '@/lib/charades/favorites';
import { toggleFavorite } from '@/lib/charades/favorites';
import {
  startGame,
  markCorrect,
  markPass,
  undo,
  endGame,
  type GameState,
  type WordResult,
} from '@/lib/charades/game-reducer';
import { playTone, toneSpec } from '@/lib/charades/sound';

const STORAGE_KEY = 'jurepi-charades';
const SEARCH_DEBOUNCE = 120;

/**
 * Simple search filter for decks by title/category/difficulty.
 * Deliberately a tiny local copy (not extracted) — same trivial shape as
 * speed-quiz's searchDecks, not worth sharing across the UI-not-shared boundary.
 */
function searchDecks(decks: MergedDeck[], query: string, locale: 'ko' | 'en'): MergedDeck[] {
  if (!query.trim()) return decks;

  const q = query.toLowerCase();
  return decks.filter((deck) => {
    const title = locale === 'ko' ? deck.ko.title : deck.en.title;
    const titleMatch = title.toLowerCase().includes(q);
    const categoryMatch = deck.category.toLowerCase().includes(q);
    const difficultyMatch = deck.difficulty.toLowerCase().includes(q);
    return titleMatch || categoryMatch || difficultyMatch;
  });
}

export interface UseCharadesReturn {
  mounted: boolean;
  locale: 'ko' | 'en';

  filtered: MergedDeck[];
  query: string;
  setQuery: (q: string) => void;
  resultCount: number;
  activeCategory: 'all' | string | 'favorites';
  setActiveCategory: (c: 'all' | string | 'favorites') => void;
  favorites: string[];
  toggleFavorite: (slug: string) => void;

  phase: 'browse' | 'setup' | 'playing' | 'summary';
  selectedDeck: MergedDeck | null;
  openSetup: (slug: string) => void;
  cancelSetup: () => void;
  goHome: () => void;

  settings: {
    difficulty?: 'easy' | 'normal' | 'hard';
    roundTimeSeconds: number | null;
    shuffle: boolean;
    showHints: boolean;
  };
  setSetting: <K extends keyof UseCharadesReturn['settings']>(
    key: K,
    value: UseCharadesReturn['settings'][K]
  ) => void;
  startGame: () => void;

  game: GameState | null;
  currentWord: { term: string; hint?: string } | null;
  index: number;
  total: number;
  timerMs: number | null;
  roundTimeMs: number | null;
  score: { correct: number; pass: number; timeout: number };
  canUndo: boolean;
  markCorrect: () => void;
  markPass: () => void;
  undo: () => void;
  endGame: () => void;

  summaryWords: { term: string; result: WordResult }[];
  outcome: 'done' | 'timeout';

  soundOn: boolean;
  toggleSound: () => void;
}

interface State {
  catalog: MergedDeck[];
  store: CharadesStore;
  queryDraft: string;
  queryCommitted: string;
  activeCategory: 'all' | string | 'favorites';
  phase: 'browse' | 'setup' | 'playing' | 'summary';
  selectedSlug: string | null;
  game: GameState | null;
  setupSettings: {
    difficulty?: 'easy' | 'normal' | 'hard';
    roundTimeSeconds: number | null;
    shuffle: boolean;
    showHints: boolean;
  };
  mounted: boolean;
}

type Action =
  | { type: 'SET_CATALOG'; payload: MergedDeck[] }
  | { type: 'SET_STORE'; payload: CharadesStore }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_QUERY_DRAFT'; payload: string }
  | { type: 'COMMIT_QUERY'; payload: string }
  | { type: 'SET_CATEGORY'; payload: 'all' | string | 'favorites' }
  | { type: 'OPEN_SETUP'; payload: string }
  | { type: 'CANCEL_SETUP' }
  | { type: 'GO_HOME' }
  | { type: 'SET_SETUP_SETTING'; payload: { key: string; value: unknown } }
  | { type: 'START_GAME'; payload: GameState }
  | { type: 'MARK_CORRECT' }
  | { type: 'MARK_PASS' }
  | { type: 'UNDO' }
  | { type: 'END_GAME' }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'TOGGLE_SOUND' };

function initialState(catalog: MergedDeck[] = []): State {
  return {
    catalog,
    store: {
      version: STORE_VERSION,
      settings: {
        roundTimeSeconds: 60,
        shuffleOn: true,
        soundOn: true,
      },
      favorites: [],
      recents: [],
    },
    queryDraft: '',
    queryCommitted: '',
    activeCategory: 'all',
    phase: 'browse',
    selectedSlug: null,
    game: null,
    setupSettings: {
      roundTimeSeconds: 60,
      shuffle: true,
      showHints: false,
    },
    mounted: false,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CATALOG':
      return { ...state, catalog: action.payload };
    case 'SET_STORE':
      return {
        ...state,
        store: action.payload,
        setupSettings: {
          difficulty: action.payload.settings.lastDifficulty as any,
          roundTimeSeconds: action.payload.settings.roundTimeSeconds ?? 60,
          shuffle: action.payload.settings.shuffleOn ?? true,
          showHints: false,
        },
      };
    case 'SET_MOUNTED':
      return { ...state, mounted: true };
    case 'SET_QUERY_DRAFT':
      return { ...state, queryDraft: action.payload };
    case 'COMMIT_QUERY':
      return { ...state, queryCommitted: action.payload };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.payload };
    case 'OPEN_SETUP': {
      const deck = state.catalog.find((d) => d.slug === action.payload);
      if (!deck) return state;
      return {
        ...state,
        phase: 'setup',
        selectedSlug: action.payload,
        setupSettings: {
          ...state.setupSettings,
          difficulty: deck.difficulty,
        },
      };
    }
    case 'CANCEL_SETUP':
      return { ...state, phase: 'browse', selectedSlug: null };
    case 'GO_HOME':
      return { ...state, phase: 'browse', selectedSlug: null, game: null };
    case 'SET_SETUP_SETTING': {
      const { key, value } = action.payload;
      return {
        ...state,
        setupSettings: { ...state.setupSettings, [key]: value },
      };
    }
    case 'START_GAME': {
      const newStore = {
        ...state.store,
        settings: {
          ...state.store.settings,
          lastDifficulty: state.setupSettings.difficulty,
          roundTimeSeconds: state.setupSettings.roundTimeSeconds ?? 60,
          shuffleOn: state.setupSettings.shuffle,
        },
      };
      if (state.selectedSlug) {
        newStore.recents = pushRecent(newStore.recents, state.selectedSlug, RECENTS_MAX);
      }
      return { ...state, phase: 'playing', game: action.payload, store: newStore };
    }
    case 'MARK_CORRECT': {
      if (!state.game) return state;
      const g = markCorrect(state.game);
      return { ...state, game: g, phase: g.status === 'summary' ? 'summary' : 'playing' };
    }
    case 'MARK_PASS': {
      if (!state.game) return state;
      const g = markPass(state.game);
      return { ...state, game: g, phase: g.status === 'summary' ? 'summary' : 'playing' };
    }
    case 'UNDO':
      if (!state.game) return state;
      return { ...state, game: undo(state.game) };
    case 'END_GAME': {
      if (!state.game) return state;
      return { ...state, game: endGame(state.game), phase: 'summary' };
    }
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        store: { ...state.store, favorites: toggleFavorite(state.store.favorites, action.payload) },
      };
    case 'TOGGLE_SOUND':
      return {
        ...state,
        store: {
          ...state.store,
          settings: { ...state.store.settings, soundOn: !state.store.settings.soundOn },
        },
      };
    default:
      return state;
  }
}

export function useCharades(): UseCharadesReturn {
  const locale = useLocale() as 'ko' | 'en';
  const [state, dispatch] = useReducer(reducer, initialState());

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const [timerMs, setTimerMs] = useState<number | null>(null);

  // Load catalog on mount
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const module = await import('./data/charades.generated.json');
        const decks = (module.default || module) as MergedDeck[];
        dispatch({ type: 'SET_CATALOG', payload: decks });

        const stored = localStorage.getItem(STORAGE_KEY);
        let store: CharadesStore;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const validated = CharadesStoreSchema.safeParse(parsed);
            store = validated.success ? validated.data : initialState().store;
          } catch {
            store = initialState().store;
          }
        } else {
          store = initialState().store;
        }

        store.recents = pruneUnknown(store.recents, decks);
        store.favorites = pruneUnknown(store.favorites, decks);

        dispatch({ type: 'SET_STORE', payload: store });
        dispatch({ type: 'SET_MOUNTED' });
      } catch {
        dispatch({ type: 'SET_MOUNTED' });
      }
    };

    loadCatalog();
  }, []);

  const persistStore = useCallback((storeData: CharadesStore) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeData));
    } catch {
      // Silent fail: quota exceeded or security error
    }
  }, []);

  useEffect(() => {
    if (state.mounted) {
      persistStore(state.store);
    }
  }, [state.store, state.mounted, persistStore]);

  const commitQuery = useCallback((q: string) => {
    dispatch({ type: 'COMMIT_QUERY', payload: q });
  }, []);

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

  // Timer management
  useEffect(() => {
    if (state.game?.status !== 'playing' || state.setupSettings.roundTimeSeconds === null) {
      setTimerMs(null);
      if (timerInterval.current) clearInterval(timerInterval.current);
      return;
    }

    const startTime = Date.now();
    const duration = state.setupSettings.roundTimeSeconds * 1000;
    setTimerMs(duration);

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimerMs(remaining);

      if (remaining <= 0) {
        dispatch({ type: 'END_GAME' });
        if (timerInterval.current) clearInterval(timerInterval.current);
      }
    };

    timerInterval.current = setInterval(tick, 100);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [state.game?.status, state.setupSettings.roundTimeSeconds]);

  const filtered = useMemo(() => {
    let result = state.catalog;

    if (state.activeCategory === 'favorites') {
      result = result.filter((d) => state.store.favorites.includes(d.slug));
    } else if (state.activeCategory !== 'all') {
      result = result.filter((d) => d.category === state.activeCategory);
    }

    return searchDecks(result, state.queryCommitted, locale);
  }, [state.catalog, state.activeCategory, state.queryCommitted, state.store.favorites, locale]);

  const currentWord =
    state.game && state.game.currentIndex < state.game.words.length
      ? (() => {
          const w = state.game.words[state.game.currentIndex];
          const localeWords =
            locale === 'ko'
              ? state.catalog.find((d) => d.slug === state.game!.deckId)?.ko.words
              : state.catalog.find((d) => d.slug === state.game!.deckId)?.en.words;
          const localeWord = localeWords?.[state.game.currentIndex];
          return {
            term: localeWord?.term || w.term,
            hint: state.setupSettings.showHints ? localeWord?.hint || w.hint : undefined,
          };
        })()
      : null;

  const outcome: 'done' | 'timeout' =
    state.game?.status === 'summary' && state.game.words.some((w) => w.result === 'timeout')
      ? 'timeout'
      : 'done';

  const summaryWords =
    state.game && state.game.status === 'summary'
      ? state.game.words.map((w, idx) => ({
          term:
            locale === 'ko'
              ? state.catalog.find((d) => d.slug === state.game!.deckId)?.ko.words[idx]?.term || w.term
              : state.catalog.find((d) => d.slug === state.game!.deckId)?.en.words[idx]?.term || w.term,
          result: w.result,
        }))
      : [];

  return {
    mounted: state.mounted,
    locale,
    filtered,
    query: state.queryDraft,
    setQuery: setQueryDraft,
    resultCount: filtered.length,
    activeCategory: state.activeCategory,
    setActiveCategory: (c) => dispatch({ type: 'SET_CATEGORY', payload: c }),
    favorites: state.store.favorites,
    toggleFavorite: (slug) => dispatch({ type: 'TOGGLE_FAVORITE', payload: slug }),
    phase: state.phase,
    selectedDeck: state.selectedSlug ? state.catalog.find((d) => d.slug === state.selectedSlug) || null : null,
    openSetup: (slug) => dispatch({ type: 'OPEN_SETUP', payload: slug }),
    cancelSetup: () => dispatch({ type: 'CANCEL_SETUP' }),
    goHome: () => dispatch({ type: 'GO_HOME' }),
    settings: state.setupSettings,
    setSetting: (key, value) => dispatch({ type: 'SET_SETUP_SETTING', payload: { key, value } }),
    startGame: () => {
      if (!state.selectedSlug) return;
      const deck = state.catalog.find((d) => d.slug === state.selectedSlug);
      if (!deck) return;
      const seed = Math.floor(Math.random() * 0xffffffff);
      const newGame = startGame(
        deck,
        {
          difficulty: state.setupSettings.difficulty || 'easy',
          roundTimeSeconds: state.setupSettings.roundTimeSeconds,
          shuffle: state.setupSettings.shuffle,
          showHints: state.setupSettings.showHints,
        },
        seed
      );
      dispatch({ type: 'START_GAME', payload: newGame });
    },
    game: state.game,
    currentWord,
    index: state.game?.currentIndex ?? 0,
    total: state.game?.words.length ?? 0,
    timerMs,
    roundTimeMs: state.setupSettings.roundTimeSeconds ? state.setupSettings.roundTimeSeconds * 1000 : null,
    score: state.game?.score || { correct: 0, pass: 0, timeout: 0 },
    canUndo: (state.game?.currentIndex ?? 0) > 0,
    markCorrect: () => {
      playTone(toneSpec('chime'), state.store.settings.soundOn);
      dispatch({ type: 'MARK_CORRECT' });
    },
    markPass: () => {
      playTone(toneSpec('buzz'), state.store.settings.soundOn);
      dispatch({ type: 'MARK_PASS' });
    },
    undo: () => dispatch({ type: 'UNDO' }),
    endGame: () => dispatch({ type: 'END_GAME' }),
    summaryWords,
    outcome,
    soundOn: state.store.settings.soundOn,
    toggleSound: () => dispatch({ type: 'TOGGLE_SOUND' }),
  };
}
