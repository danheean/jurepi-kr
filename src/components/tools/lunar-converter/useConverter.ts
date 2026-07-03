'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { solarToLunar, lunarToSolar } from '@/lib/lunar-converter/conversion';
import { pushRecent, serializeRecents, deserializeRecents } from '@/lib/lunar-converter/recents';
import type { ConversionResult, ConversionError, RecentEntry } from '@/lib/lunar-converter/schema';

const STORE_KEY = 'jurepi-lunar-converter';

export interface ConverterState {
  // Current input values
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarIsLeap: boolean;

  // Which calendar was last edited (determines conversion direction)
  lastEditedCalendar: 'solar' | 'lunar' | null;

  // Last conversion result
  result: ConversionResult | ConversionError | null;

  // Recent history (max 10)
  recents: RecentEntry[];

  // Copy feedback state
  copyKey: 'solar' | 'lunar' | 'both' | null;

  // Mount gate
  isMounted: boolean;
}

export type ConverterAction =
  | { type: 'SET_SOLAR'; year: number; month: number; day: number }
  | { type: 'SET_LUNAR'; year: number; month: number; day: number; isLeap: boolean }
  | { type: 'SET_RESULT'; result: ConversionResult | ConversionError }
  | { type: 'SET_RECENTS'; recents: RecentEntry[] }
  | { type: 'SET_COPY_KEY'; key: ConverterState['copyKey'] }
  | { type: 'SET_MOUNTED'; mounted: boolean }
  | { type: 'SET_LAST_EDITED'; calendar: 'solar' | 'lunar' };

const initialState: ConverterState = {
  solarYear: 0,
  solarMonth: 0,
  solarDay: 0,
  lunarYear: 0,
  lunarMonth: 0,
  lunarDay: 0,
  lunarIsLeap: false,
  lastEditedCalendar: null,
  result: null,
  recents: [],
  copyKey: null,
  isMounted: false,
};

function converterReducer(state: ConverterState, action: ConverterAction): ConverterState {
  switch (action.type) {
    case 'SET_SOLAR':
      return {
        ...state,
        solarYear: action.year,
        solarMonth: action.month,
        solarDay: action.day,
        lastEditedCalendar: 'solar',
      };
    case 'SET_LUNAR':
      return {
        ...state,
        lunarYear: action.year,
        lunarMonth: action.month,
        lunarDay: action.day,
        lunarIsLeap: action.isLeap,
        lastEditedCalendar: 'lunar',
      };
    case 'SET_RESULT':
      return { ...state, result: action.result };
    case 'SET_RECENTS':
      return { ...state, recents: action.recents };
    case 'SET_COPY_KEY':
      return { ...state, copyKey: action.key };
    case 'SET_MOUNTED':
      return { ...state, isMounted: action.mounted };
    case 'SET_LAST_EDITED':
      return { ...state, lastEditedCalendar: action.calendar };
    default:
      return state;
  }
}

export function useConverter() {
  const [state, dispatch] = useReducer(converterReducer, initialState);

  // Load recents on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const recents = raw ? deserializeRecents(raw) : [];
      dispatch({ type: 'SET_RECENTS', recents });
    } catch {
      // Fail gracefully
    }
    dispatch({ type: 'SET_MOUNTED', mounted: true });
  }, []);

  // Conversion effect: when solar date changes, convert to lunar
  useEffect(() => {
    if (!state.isMounted || state.lastEditedCalendar !== 'solar') return;
    if (!state.solarYear || !state.solarMonth || !state.solarDay) return;

    const convert = async () => {
      const result = await solarToLunar(state.solarYear, state.solarMonth, state.solarDay);
      dispatch({ type: 'SET_RESULT', result });

      if ('solarDate' in result && result) {
        // Update lunar inputs from result
        if (
          state.lunarYear !== result.lunarDate.year ||
          state.lunarMonth !== result.lunarDate.month ||
          state.lunarDay !== result.lunarDate.day ||
          state.lunarIsLeap !== result.lunarDate.isLeap
        ) {
          dispatch({
            type: 'SET_LUNAR',
            year: result.lunarDate.year,
            month: result.lunarDate.month,
            day: result.lunarDate.day,
            isLeap: result.lunarDate.isLeap,
          });
        }

        // Add to recents
        const solarStr = `${result.solarDate.year}-${String(result.solarDate.month).padStart(2, '0')}-${String(result.solarDate.day).padStart(2, '0')}`;
        const lunarStr = `${result.lunarDate.year}-${String(result.lunarDate.month).padStart(2, '0')}-${String(result.lunarDate.day).padStart(2, '0')}${result.lunarDate.isLeap ? '(윤)' : ''}`;
        const newRecents = pushRecent(state.recents, solarStr, lunarStr);
        dispatch({ type: 'SET_RECENTS', recents: newRecents });
        try {
          const serialized = serializeRecents(newRecents);
          localStorage.setItem(STORE_KEY, JSON.stringify(serialized));
        } catch {
          // Fail gracefully (quota exceeded, etc.)
        }
      }
    };

    convert();
  }, [state.solarYear, state.solarMonth, state.solarDay, state.isMounted, state.lastEditedCalendar]);

  // Conversion effect: when lunar date changes, convert to solar
  useEffect(() => {
    if (!state.isMounted || state.lastEditedCalendar !== 'lunar') return;
    if (!state.lunarYear || !state.lunarMonth || !state.lunarDay) return;

    const convert = async () => {
      const result = await lunarToSolar(
        state.lunarYear,
        state.lunarMonth,
        state.lunarDay,
        state.lunarIsLeap
      );
      dispatch({ type: 'SET_RESULT', result });

      if ('solarDate' in result && result) {
        // Update solar inputs from result
        if (
          state.solarYear !== result.solarDate.year ||
          state.solarMonth !== result.solarDate.month ||
          state.solarDay !== result.solarDate.day
        ) {
          dispatch({
            type: 'SET_SOLAR',
            year: result.solarDate.year,
            month: result.solarDate.month,
            day: result.solarDate.day,
          });
        }

        // Add to recents
        const solarStr = `${result.solarDate.year}-${String(result.solarDate.month).padStart(2, '0')}-${String(result.solarDate.day).padStart(2, '0')}`;
        const lunarStr = `${result.lunarDate.year}-${String(result.lunarDate.month).padStart(2, '0')}-${String(result.lunarDate.day).padStart(2, '0')}${result.lunarDate.isLeap ? '(윤)' : ''}`;
        const newRecents = pushRecent(state.recents, solarStr, lunarStr);
        dispatch({ type: 'SET_RECENTS', recents: newRecents });
        try {
          const serialized = serializeRecents(newRecents);
          localStorage.setItem(STORE_KEY, JSON.stringify(serialized));
        } catch {
          // Fail gracefully (quota exceeded, etc.)
        }
      }
    };

    convert();
  }, [state.lunarYear, state.lunarMonth, state.lunarDay, state.lunarIsLeap, state.isMounted, state.lastEditedCalendar]);

  // Copy to clipboard
  const handleCopy = useCallback(
    async (key: 'solar' | 'lunar' | 'both') => {
      if (!state.result || !('solarDate' in state.result)) return;

      const result = state.result as ConversionResult;
      const solarStr = `${result.solarDate.year}-${String(result.solarDate.month).padStart(2, '0')}-${String(result.solarDate.day).padStart(2, '0')}`;
      const lunarStr = `${result.lunarDate.year}-${String(result.lunarDate.month).padStart(2, '0')}-${String(result.lunarDate.day).padStart(2, '0')}${result.lunarDate.isLeap ? '(윤)' : ''}`;

      let text = '';
      if (key === 'solar') {
        text = solarStr;
      } else if (key === 'lunar') {
        text = lunarStr;
      } else {
        text = `${solarStr} / ${lunarStr}`;
      }

      try {
        await navigator.clipboard.writeText(text);
        dispatch({ type: 'SET_COPY_KEY', key });
        setTimeout(() => dispatch({ type: 'SET_COPY_KEY', key: null }), 1500);
      } catch {
        // Silent fail
      }
    },
    [state.result]
  );

  // Load a recent conversion
  const loadRecent = useCallback((r: RecentEntry) => {
    const [sy, sm, sd] = r.solarDate.split('-').map(Number);
    const lunarPart = r.lunarDate.replace('(윤)', '');
    const [ly, lm, ld] = lunarPart.split('-').map(Number);
    const isLeap = r.lunarDate.includes('(윤)');

    dispatch({ type: 'SET_SOLAR', year: sy, month: sm, day: sd });
    dispatch({ type: 'SET_LUNAR', year: ly, month: lm, day: ld, isLeap });
  }, []);

  // Stable action methods
  const setSolar = useCallback(
    (y: number, m: number, d: number) => {
      dispatch({ type: 'SET_SOLAR', year: y, month: m, day: d });
    },
    []
  );

  const setLunar = useCallback(
    (y: number, m: number, d: number, isLeap: boolean) => {
      dispatch({ type: 'SET_LUNAR', year: y, month: m, day: d, isLeap });
    },
    []
  );

  const setToday = useCallback((sy: number, sm: number, sd: number) => {
    dispatch({ type: 'SET_SOLAR', year: sy, month: sm, day: sd });
  }, []);

  return {
    // State
    solarYear: state.solarYear,
    solarMonth: state.solarMonth,
    solarDay: state.solarDay,
    lunarYear: state.lunarYear,
    lunarMonth: state.lunarMonth,
    lunarDay: state.lunarDay,
    lunarIsLeap: state.lunarIsLeap,
    result: state.result,
    recents: state.recents,
    copyKey: state.copyKey,
    isMounted: state.isMounted,
    lastEditedCalendar: state.lastEditedCalendar,

    // Actions
    setSolar,
    setLunar,
    setToday,
    copy: handleCopy,
    loadRecent,
  };
}
