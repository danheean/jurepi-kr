'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatJson,
  minifyJson,
  getStats,
  sortKeysRecursive,
  validateJsonUrl,
  fetchJsonFromUrl,
  parseStorage,
  serializeStorage,
  DEBOUNCE_MS,
  TOAST_DURATION_MS,
  type FormatOptions,
  type ParseResult,
  type JsonStats,
  type JsonUrlError,
} from '@/lib/json-formatter';

export interface UseJsonFormatterState {
  input: string;
  indent: FormatOptions['indent'];
  sortKeys: boolean;
  parseResult: ParseResult;
  stats: JsonStats | null;
  isLoading: boolean;
  error: JsonUrlError | null;
}

export interface UseJsonFormatterActions {
  setInput: (text: string) => void;
  setIndent: (indent: FormatOptions['indent']) => void;
  toggleSortKeys: () => void;
  format: () => void;
  minify: () => void;
  clear: () => void;
  clearError: () => void;
  loadFromUrl: (url: string) => Promise<void>;
  copyFormatted: () => Promise<boolean>;
  downloadJson: (filename?: string) => void;
}

export function useJsonFormatter(): [
  UseJsonFormatterState,
  UseJsonFormatterActions
] {
  // All hooks ABOVE early return
  const [state, setState] = useState<UseJsonFormatterState>(() => {
    // Load from localStorage on mount
    if (typeof window === 'undefined') {
      return {
        input: '',
        indent: '2',
        sortKeys: false,
        parseResult: { success: false },
        stats: null,
        isLoading: false,
        error: null,
      };
    }

    try {
      const stored = localStorage.getItem('jurepi-json-formatter');
      const parsed = parseStorage(stored || '{}');

      return {
        input: parsed.lastInput || '',
        indent: parsed.indent,
        sortKeys: parsed.sortKeys,
        parseResult: { success: false },
        stats: null,
        isLoading: false,
        error: null,
      };
    } catch {
      return {
        input: '',
        indent: '2',
        sortKeys: false,
        parseResult: { success: false },
        stats: null,
        isLoading: false,
        error: null,
      };
    }
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Parse on input change (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Empty input is the idle state, not invalid JSON — no error, no output
      if (!state.input.trim()) {
        setState((prev) => ({
          ...prev,
          parseResult: { success: false },
          stats: null,
        }));
        return;
      }

      const options: FormatOptions = {
        indent: state.indent,
        sortKeys: state.sortKeys,
      };

      const result = formatJson(state.input, options);

      let stats: JsonStats | null = null;
      if (result.success && result.json !== undefined) {
        stats = getStats(result.json);
      }

      setState((prev) => ({
        ...prev,
        parseResult: result,
        stats,
      }));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state.input, state.indent, state.sortKeys]);

  // Persist preferences to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const toStore = {
        version: 1 as const,
        indent: state.indent,
        sortKeys: state.sortKeys,
      };
      localStorage.setItem('jurepi-json-formatter', serializeStorage(toStore));
    } catch {
      // localStorage unavailable (private mode) — silent fail
    }
  }, [state.indent, state.sortKeys]);

  // Actions (stable references)
  const setInput = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      input: text,
      error: null,
    }));
  }, []);

  const setIndent = useCallback(
    (indent: FormatOptions['indent']) => {
      setState((prev) => ({
        ...prev,
        indent,
      }));
    },
    []
  );

  const toggleSortKeys = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sortKeys: !prev.sortKeys,
    }));
  }, []);

  const format = useCallback(() => {
    const options: FormatOptions = {
      indent: state.indent,
      sortKeys: state.sortKeys,
    };

    const result = formatJson(state.input, options);
    let stats: JsonStats | null = null;

    if (result.success && result.json !== undefined) {
      stats = getStats(result.json);
    }

    setState((prev) => ({
      ...prev,
      parseResult: result,
      stats,
    }));
  }, [state.input, state.indent, state.sortKeys]);

  const minify = useCallback(() => {
    const result = minifyJson(state.input);
    let stats: JsonStats | null = null;

    if (result.success && result.json !== undefined) {
      stats = getStats(result.json);
    }

    setState((prev) => ({
      ...prev,
      parseResult: result,
      stats,
    }));
  }, [state.input]);

  const clear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      input: '',
      parseResult: { success: false },
      stats: null,
      error: null,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => (prev.error ? { ...prev, error: null } : prev));
  }, []);

  const loadFromUrl = useCallback(async (url: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const urlValidation = validateJsonUrl(url);

      if (!urlValidation.ok) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: urlValidation.error,
        }));
        return;
      }

      const fetchResult = await fetchJsonFromUrl(urlValidation.url);

      if ('error' in fetchResult) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: fetchResult.error,
        }));
        return;
      }

      // Success: update input with fetched text
      const fetchedText = fetchResult.text;
      setState((prev) => ({
        ...prev,
        input: fetchedText,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          code: 'cors_or_network',
          message: 'errors.urlLoad.cors_or_network',
        },
      }));
    }
  }, []);

  const copyFormatted = useCallback(async (): Promise<boolean> => {
    if (!state.parseResult.success || !state.parseResult.output) {
      return false;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(state.parseResult.output);
        return true;
      }

      // Fallback: copy via textarea
      const textarea = document.createElement('textarea');
      textarea.value = state.parseResult.output;
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }, [state.parseResult]);

  const downloadJson = useCallback(
    (filename: string = 'data.json') => {
      if (!state.parseResult.success || !state.parseResult.output) {
        return;
      }

      try {
        const blob = new Blob([state.parseResult.output], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Silent fail
      }
    },
    [state.parseResult]
  );

  const actions: UseJsonFormatterActions = {
    setInput,
    setIndent,
    toggleSortKeys,
    format,
    minify,
    clear,
    clearError,
    loadFromUrl,
    copyFormatted,
    downloadJson,
  };

  return [state, actions];
}
