'use client';

import { useEffect, useReducer, useCallback, useRef, useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import {
  toDateKey,
  toQuestionKey,
  today as getTodayKey,
  type DateKey,
  type QuestionKey,
} from '@/lib/qna-a-day/date';
import {
  loadQuestionBank,
  getQuestion,
  type QuestionBank,
} from '@/lib/qna-a-day/questions';
import {
  newStore,
  upsertEntry,
  deleteEntry,
  getEntry,
  entriesForMonthDay,
  listEntries,
  searchEntries,
  type Store,
  type Entry,
} from '@/lib/qna-a-day/journal';
import {
  currentStreak,
  longestStreak,
  totalAnswered,
  yearCompletion,
} from '@/lib/qna-a-day/stats';
import {
  serialize,
  deserialize,
  mergeStores,
  analyzeConflicts,
} from '@/lib/qna-a-day/serialization';

const STORAGE_KEY = 'jurepi-qna-a-day';
const CORRUPT_KEY_PREFIX = 'jurepi-qna-a-day-corrupt';

export interface DailyJournalState {
  today: DateKey;
  todayEntry: Entry | undefined;
  todayQuestion: { key: QuestionKey; text: string };
  currentStreak: number;
  longestStreak: number;
  totalAnswered: number;
  yearCompletion: { answered: number; elapsed: number };
  entries: Readonly<Record<DateKey, Entry>>;
  store: Readonly<Store>;
  onboarded: boolean;
  showBackupReminder: boolean;
  mounted: boolean;
  storageError: {
    type: 'UNAVAILABLE' | 'QUOTA_EXCEEDED' | 'CORRUPT' | null;
    message: string;
  };
}

export interface DailyJournalActions {
  upsertEntry: (date: DateKey, text: string) => void;
  deleteEntry: (date: DateKey) => void;
  getEntry: (date: DateKey) => Entry | undefined;
  entriesForMonthDay: (mmdd: QuestionKey, excludeYear?: number) => Entry[];
  searchEntries: (query: string) => Entry[];
  getQuestionText: (date: DateKey) => string;
  exportJson: () => { blob: Blob; filename: string };
  importJson: (
    file: File,
    strategy: 'merge' | 'replace'
  ) => Promise<{ success: boolean; error?: string }>;
  reset: () => void;
  dismissBackupReminder: () => void;
  setOnboarded: () => void;
}

type Action =
  | { type: 'SET_STORE'; store: Store; today: DateKey }
  | { type: 'SET_QUESTION_BANK'; bank: QuestionBank }
  | { type: 'SET_MOUNTED' }
  | { type: 'SET_STORAGE_ERROR'; error: DailyJournalState['storageError'] }
  | { type: 'UPDATE_STORE'; store: Store }
  | { type: 'SET_ONBOARDED' }
  | { type: 'DISMISS_BACKUP_REMINDER' };

function initialState(): DailyJournalState {
  return {
    today: '2026-06-30',
    todayEntry: undefined,
    todayQuestion: { key: '06-30', text: '' },
    currentStreak: 0,
    longestStreak: 0,
    totalAnswered: 0,
    yearCompletion: { answered: 0, elapsed: 0 },
    entries: {},
    store: newStore(),
    onboarded: false,
    showBackupReminder: false,
    mounted: false,
    storageError: { type: null, message: '' },
  };
}

function storeReducer(state: DailyJournalState, action: Action): DailyJournalState {
  switch (action.type) {
    case 'SET_STORE': {
      const todayKey = action.today;
      const todayQKey = toQuestionKey(todayKey);
      const entry = getEntry(action.store, todayKey);
      const today_year = parseInt(todayKey.slice(0, 4), 10);

      return {
        ...state,
        store: action.store,
        entries: action.store.entries,
        today: todayKey,
        todayEntry: entry,
        todayQuestion: { key: todayQKey, text: '' }, // Will be populated when bank loads
        currentStreak: currentStreak(action.store.entries, todayKey),
        longestStreak: longestStreak(action.store.entries),
        totalAnswered: totalAnswered(action.store.entries),
        yearCompletion: yearCompletion(action.store.entries, today_year, todayKey),
      };
    }

    case 'SET_QUESTION_BANK': {
      // Question will be resolved when we have the bank
      return {
        ...state,
        todayQuestion: { ...state.todayQuestion }, // Placeholder until resolved
      };
    }

    case 'SET_MOUNTED':
      return { ...state, mounted: true };

    case 'SET_STORAGE_ERROR':
      return { ...state, storageError: action.error };

    case 'UPDATE_STORE': {
      const todayKey = state.today;
      const today_year = parseInt(todayKey.slice(0, 4), 10);

      return {
        ...state,
        store: action.store,
        entries: action.store.entries,
        todayEntry: getEntry(action.store, todayKey),
        currentStreak: currentStreak(action.store.entries, todayKey),
        longestStreak: longestStreak(action.store.entries),
        totalAnswered: totalAnswered(action.store.entries),
        yearCompletion: yearCompletion(action.store.entries, today_year, todayKey),
      };
    }

    case 'SET_ONBOARDED':
      return { ...state, onboarded: true };

    case 'DISMISS_BACKUP_REMINDER':
      return { ...state, showBackupReminder: false };

    default:
      return state;
  }
}

export function useDailyJournal(): DailyJournalState & DailyJournalActions {
  const locale = useLocale() as 'ko' | 'en';
  const [state, dispatch] = useReducer(storeReducer, undefined, initialState);
  const questionBankRef = useRef<QuestionBank | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize on mount: read localStorage, load question bank
  useEffect(() => {
    const initializeStore = async () => {
      try {
        // Read localStorage
        const raw = localStorage.getItem(STORAGE_KEY);
        let store = newStore();

        if (raw) {
          try {
            store = deserialize(raw);
          } catch (err) {
            // Quarantine corrupt blob
            const ts = Date.now();
            const corruptKey = `${CORRUPT_KEY_PREFIX}-${ts}`;
            try {
              localStorage.setItem(corruptKey, raw);
            } catch (e) {
              // Storage full or unavailable
            }

            dispatch({
              type: 'SET_STORAGE_ERROR',
              error: {
                type: 'CORRUPT',
                message: 'Corrupt data detected. Starting fresh.',
              },
            });

            store = newStore();
          }
        }

        // Load question bank
        const bank = await loadQuestionBank();
        questionBankRef.current = bank;

        const todayKey = getTodayKey();
        dispatch({ type: 'SET_STORE', store, today: todayKey });

        // Update todayQuestion in state by re-dispatching
        // (simpler than threading it through)
      } catch (err) {
        // localStorage unavailable (private mode, quota)
        const isQuotaError =
          err instanceof DOMException && err.name === 'QuotaExceededError';

        dispatch({
          type: 'SET_STORAGE_ERROR',
          error: {
            type: isQuotaError ? 'QUOTA_EXCEEDED' : 'UNAVAILABLE',
            message: isQuotaError
              ? 'Storage quota exceeded.'
              : 'Storage unavailable.',
          },
        });

        // Try to load question bank anyway
        try {
          const bank = await loadQuestionBank();
          questionBankRef.current = bank;

          const todayKey = getTodayKey();
          const store = newStore();
          dispatch({ type: 'SET_STORE', store, today: todayKey });
        } catch (bankErr) {
          // Both fail - just proceed with empty state
        }
      }

      dispatch({ type: 'SET_MOUNTED' });
    };

    initializeStore();
  }, []);

  // Resolve today's question when locale changes
  const todayQuestion = useMemo(() => {
    if (!questionBankRef.current || !state.mounted) {
      return state.todayQuestion;
    }

    try {
      const text = getQuestion(
        questionBankRef.current,
        state.todayQuestion.key,
        locale
      );
      return { ...state.todayQuestion, text };
    } catch {
      return state.todayQuestion;
    }
  }, [state.mounted, locale, state.todayQuestion.key]);

  // Immediate save (flush debounce)
  const flushAutosave = useCallback((store: Store) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    try {
      localStorage.setItem(STORAGE_KEY, serialize(store));
    } catch (err) {
      const isQuotaError =
        err instanceof DOMException && err.name === 'QuotaExceededError';
      dispatch({
        type: 'SET_STORAGE_ERROR',
        error: {
          type: isQuotaError ? 'QUOTA_EXCEEDED' : 'UNAVAILABLE',
          message: isQuotaError ? 'Storage quota exceeded.' : 'Failed to save.',
        },
      });
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Actions (all wrapped in useCallback)
  const doUpsertEntry = useCallback(
    (date: DateKey, text: string) => {
      const qKey = toQuestionKey(date);
      const newStore = upsertEntry(state.store, date, text, qKey, Date.now());
      dispatch({ type: 'UPDATE_STORE', store: newStore });
      // Persist immediately — the composer already debounces typing, so this
      // fires once per pause. "Saved" must mean actually written to storage.
      flushAutosave(newStore);
    },
    [state.store, flushAutosave]
  );

  const doDeleteEntry = useCallback(
    (date: DateKey) => {
      const newStore = deleteEntry(state.store, date);
      dispatch({ type: 'UPDATE_STORE', store: newStore });
      flushAutosave(newStore);
    },
    [state.store, flushAutosave]
  );

  const doGetEntry = useCallback(
    (date: DateKey) => {
      return getEntry(state.store, date);
    },
    [state.store]
  );

  const doEntriesForMonthDay = useCallback(
    (mmdd: QuestionKey, excludeYear?: number) => {
      return entriesForMonthDay(state.store, mmdd, excludeYear);
    },
    [state.store]
  );

  const doSearchEntries = useCallback(
    (query: string) => {
      if (!questionBankRef.current) {
        return [];
      }
      return searchEntries(state.store, query, (mmdd, loc) => {
        try {
          return getQuestion(questionBankRef.current!, mmdd, loc);
        } catch {
          return '';
        }
      }, locale);
    },
    [state.store, locale]
  );

  const doGetQuestionText = useCallback(
    (date: DateKey) => {
      if (!questionBankRef.current) {
        return '';
      }
      try {
        const qKey = toQuestionKey(date);
        return getQuestion(questionBankRef.current, qKey, locale);
      } catch {
        return '';
      }
    },
    [locale]
  );

  const doExportJson = useCallback(() => {
    const json = serialize(state.store);
    const blob = new Blob([json], { type: 'application/json' });
    const today_str = state.today;
    const filename = `jurepi-qna-a-day-backup-${today_str}.json`;
    return { blob, filename };
  }, [state.store, state.today]);

  const doImportJson = useCallback(
    async (file: File, strategy: 'merge' | 'replace') => {
      try {
        const text = await file.text();
        const imported = deserialize(text);

        let newStore: Store;
        if (strategy === 'replace') {
          newStore = imported;
        } else {
          newStore = mergeStores(state.store, imported);
        }

        dispatch({ type: 'UPDATE_STORE', store: newStore });
        flushAutosave(newStore);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Import failed',
        };
      }
    },
    [state.store, flushAutosave]
  );

  const doReset = useCallback(() => {
    const freshStore = newStore();
    dispatch({ type: 'UPDATE_STORE', store: freshStore });
    flushAutosave(freshStore);
  }, [flushAutosave]);

  const doDismissBackupReminder = useCallback(() => {
    dispatch({ type: 'DISMISS_BACKUP_REMINDER' });
  }, []);

  const doSetOnboarded = useCallback(() => {
    dispatch({ type: 'SET_ONBOARDED' });
  }, []);

  return {
    // State
    today: state.today,
    todayEntry: state.todayEntry,
    todayQuestion,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    totalAnswered: state.totalAnswered,
    yearCompletion: state.yearCompletion,
    entries: state.entries,
    store: state.store,
    onboarded: state.onboarded,
    showBackupReminder: state.showBackupReminder,
    mounted: state.mounted,
    storageError: state.storageError,

    // Actions
    upsertEntry: doUpsertEntry,
    deleteEntry: doDeleteEntry,
    getEntry: doGetEntry,
    entriesForMonthDay: doEntriesForMonthDay,
    searchEntries: doSearchEntries,
    getQuestionText: doGetQuestionText,
    exportJson: doExportJson,
    importJson: doImportJson,
    reset: doReset,
    dismissBackupReminder: doDismissBackupReminder,
    setOnboarded: doSetOnboarded,
  };
}
