'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { encode, handleAlreadyEncoded } from '@/lib/url-encoder/encode';
import { decode } from '@/lib/url-encoder/decode';
import { parseQueryString } from '@/lib/url-encoder/query-parser';
import type { QueryTableRow } from '@/lib/url-encoder/schema';
import { pushRecent, deserializeRecents, serializeRecents } from '@/lib/url-encoder/recents';
import { STORAGE_KEY, INPUT_MAX_LEN, RECENTS_MAX } from '@/lib/url-encoder/schema';

const CHARSET_KEY = 'jurepi-url-encoder-charset';

export interface UseUrlEncoderState {
  text: string;
  direction: 'encode' | 'decode';
  mode: 'component' | 'uri';
  charset: 'utf-8' | 'euc-kr';
  plusAsSpace: boolean;
  batchMode: boolean;
  queryTableRows: QueryTableRow[];
  queryTableInput: string;
  result: string | null;
  error: { message: string; details: string } | null;
  alreadyEncodedHint: boolean;
  recents: string[];
  isLoading: boolean;
}

export interface UseUrlEncoderActions {
  setText(text: string): void;
  setDirection(dir: 'encode' | 'decode'): void;
  setMode(mode: 'component' | 'uri'): void;
  setCharset(charset: 'utf-8' | 'euc-kr'): void;
  setPlusAsSpace(value: boolean): void;
  setBatchMode(value: boolean): void;
  setQueryTableRows(rows: QueryTableRow[]): void;
  setQueryTableInput(input: string): void;
  process(): Promise<void>;
  addRecent(text: string): void;
  clearRecents(): void;
  copyResult(): Promise<boolean>;
  clearAll(): void;
}

export function useUrlEncoder(): [UseUrlEncoderState, UseUrlEncoderActions] {
  const [state, setState] = useState<UseUrlEncoderState>({
    text: '',
    direction: 'encode',
    mode: 'component',
    charset: 'utf-8',
    plusAsSpace: false,
    batchMode: false,
    queryTableRows: [],
    queryTableInput: '',
    result: null,
    error: null,
    alreadyEncodedHint: false,
    recents: [],
    isLoading: false,
  });

  // Always-current snapshot of state so stable callbacks (process/copyResult)
  // never read a stale closure — assigned every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Mount flag to recover/persist localStorage only on the client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let loadedRecents: string[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          loadedRecents = deserializeRecents(stored);
        }
      }
    } catch {
      // Silent fail: use empty recents if localStorage unavailable
    }

    let loadedCharset: 'utf-8' | 'euc-kr' = 'utf-8';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(CHARSET_KEY);
        if (stored === 'euc-kr' || stored === 'utf-8') {
          loadedCharset = stored;
        }
      }
    } catch {
      // Silent fail: default to utf-8
    }

    setState((prev) => ({
      ...prev,
      recents: loadedRecents,
      charset: loadedCharset,
    }));
    setMounted(true);
  }, []);

  // Persist recents whenever they change (after mount, so we never overwrite
  // stored recents with the pre-load empty array).
  useEffect(() => {
    if (!mounted) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, serializeRecents(state.recents));
      }
    } catch {
      // Silent fail
    }
  }, [state.recents, mounted]);

  const persistCharset = useCallback((charset: 'utf-8' | 'euc-kr') => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CHARSET_KEY, charset);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const setText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, text: text.slice(0, INPUT_MAX_LEN) }));
  }, []);

  const setDirection = useCallback((dir: 'encode' | 'decode') => {
    setState((prev) => ({
      ...prev,
      direction: dir,
      result: null,
      error: null,
      alreadyEncodedHint: false,
    }));
  }, []);

  const setMode = useCallback((mode: 'component' | 'uri') => {
    setState((prev) => ({ ...prev, mode, result: null, error: null }));
  }, []);

  const setCharset = useCallback(
    (charset: 'utf-8' | 'euc-kr') => {
      setState((prev) => ({ ...prev, charset, result: null, error: null }));
      persistCharset(charset);
    },
    [persistCharset]
  );

  const setPlusAsSpace = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, plusAsSpace: value, result: null, error: null }));
  }, []);

  const setBatchMode = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, batchMode: value, result: null, error: null }));
  }, []);

  const setQueryTableRows = useCallback((rows: QueryTableRow[]) => {
    setState((prev) => ({ ...prev, queryTableRows: rows }));
  }, []);

  const setQueryTableInput = useCallback((input: string) => {
    const rows = parseQueryString(input);
    setState((prev) => ({ ...prev, queryTableInput: input, queryTableRows: rows }));
  }, []);

  // Stable dispatcher: reads the latest state via stateRef (no stale closure).
  const process = useCallback(async () => {
    const s = stateRef.current;

    if (!s.text.trim()) {
      setState((prev) => ({
        ...prev,
        result: null,
        error: null,
        alreadyEncodedHint: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (s.direction === 'encode') {
        const hint = handleAlreadyEncoded(s.text);

        if (s.batchMode) {
          const lines = s.text.split('\n');
          const encodedLines = await Promise.all(
            lines.map((line) => encode(line, s.mode, s.charset).then((r) => r.result || ''))
          );
          setState((prev) => ({
            ...prev,
            result: encodedLines.join('\n'),
            alreadyEncodedHint: hint,
            error: null,
            isLoading: false,
          }));
        } else {
          const result = await encode(s.text, s.mode, s.charset);
          setState((prev) => ({
            ...prev,
            result: result.error ? null : result.result || null,
            error: result.error || null,
            alreadyEncodedHint: result.error ? false : hint,
            isLoading: false,
          }));
        }
      } else {
        if (s.batchMode) {
          const lines = s.text.split('\n');
          const decodedLines = await Promise.all(
            lines.map((line) =>
              decode(line, s.mode, s.charset, { plusAsSpace: s.plusAsSpace }).then(
                (r) => r.result || ''
              )
            )
          );
          setState((prev) => ({
            ...prev,
            result: decodedLines.join('\n'),
            alreadyEncodedHint: false,
            error: null,
            isLoading: false,
          }));
        } else {
          const result = await decode(s.text, s.mode, s.charset, {
            plusAsSpace: s.plusAsSpace,
          });
          setState((prev) => ({
            ...prev,
            result: result.error ? null : result.result || null,
            error: result.error || null,
            alreadyEncodedHint: false,
            isLoading: false,
          }));
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: {
          message: 'Unexpected error',
          details: err instanceof Error ? err.message : String(err),
        },
        result: null,
        isLoading: false,
      }));
    }
  }, []);

  // Functional update so batched calls accumulate correctly (no stale closure).
  const addRecent = useCallback((text: string) => {
    if (!text.trim()) return;
    setState((prev) => ({ ...prev, recents: pushRecent(prev.recents, text, RECENTS_MAX) }));
  }, []);

  const clearRecents = useCallback(() => {
    setState((prev) => ({ ...prev, recents: [] }));
  }, []);

  const copyResult = useCallback(async (): Promise<boolean> => {
    const result = stateRef.current.result;
    if (!result) return false;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result);
        return true;
      }

      const textarea = document.createElement('textarea');
      textarea.value = result;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      text: '',
      result: null,
      error: null,
      alreadyEncodedHint: false,
    }));
  }, []);

  return [
    state,
    {
      setText,
      setDirection,
      setMode,
      setCharset,
      setPlusAsSpace,
      setBatchMode,
      setQueryTableRows,
      setQueryTableInput,
      process,
      addRecent,
      clearRecents,
      copyResult,
      clearAll,
    },
  ];
}
