import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  safeEncode,
  safeDecode,
  encodeFile,
  decodeToBlob,
} from '@/lib/base64-encoder/encoder';
import { isValidBase64, normalizeInput } from '@/lib/base64-encoder/base64';
import {
  DEBOUNCE_MS,
  FILE_SIZE_LIMIT_MB,
  STORAGE_KEY,
  type Base64EncoderError,
} from '@/lib/base64-encoder/schema';

export interface Base64State {
  mode: 'text' | 'file';
  variant: 'standard' | 'urlSafe';
  direction: 'encode' | 'decode';
  inputText: string;
  inputFile: File | null;
  outputText: string;
  isLoading: boolean;
  error: Base64EncoderError | null;
  isValidInput: boolean;
}

export interface Base64Actions {
  setMode(mode: 'text' | 'file'): void;
  setVariant(variant: 'standard' | 'urlSafe'): void;
  setDirection(direction: 'encode' | 'decode'): void;
  setInputText(text: string): void;
  setInputFile(file: File | null): void;
  process(): Promise<void>;
  copy(target: 'base64' | 'dataUri' | 'text'): Promise<boolean>;
  download(filename?: string): void;
}

interface PersistedPrefs {
  mode: 'text' | 'file';
  variant: 'standard' | 'urlSafe';
}

/**
 * useBase64: State machine for Base64 encoding/decoding with localStorage persistence.
 * Returns [state, actions] tuple for full control over encoding/decoding workflow.
 */
export function useBase64(): [Base64State, Base64Actions] {
  // Persisted preferences
  const [mode, setModeInternal] = useState<'text' | 'file'>('text');
  const [variant, setVariantInternal] = useState<'standard' | 'urlSafe'>('standard');

  // UI state
  const [direction, setDirectionState] = useState<'encode' | 'decode'>('encode');
  const [inputText, setInputTextState] = useState('');
  const [inputFile, setInputFileState] = useState<File | null>(null);
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Base64EncoderError | null>(null);

  // Refs for debounce and cleanup
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load persisted preferences on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const prefs: PersistedPrefs = JSON.parse(stored);
        if (prefs.mode && ['text', 'file'].includes(prefs.mode)) {
          setModeInternal(prefs.mode);
        }
        if (prefs.variant && ['standard', 'urlSafe'].includes(prefs.variant)) {
          setVariantInternal(prefs.variant);
        }
      } catch {
        // Silently ignore parse errors
      }
    }
  }, []);

  // Persist preferences to localStorage (debounced)
  const persistPrefs = useCallback((m: 'text' | 'file', v: 'standard' | 'urlSafe') => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: m, variant: v }));
      } catch {
        // Silently ignore quota/security errors
      }
    }, 50);
  }, []);

  // Actions
  const setMode = useCallback((m: 'text' | 'file') => {
    if (m === 'file') {
      setInputTextState(''); // Clear text when switching to file
    } else {
      setInputFileState(null); // Clear file when switching to text
    }
    setModeInternal(m);
    persistPrefs(m, variant);
  }, [variant, persistPrefs]);

  const setVariant = useCallback((v: 'standard' | 'urlSafe') => {
    setVariantInternal(v);
    persistPrefs(mode, v);
  }, [mode, persistPrefs]);

  const setDirection = useCallback((d: 'encode' | 'decode') => {
    setDirectionState(d);
  }, []);

  const setInputFile = useCallback((file: File | null) => {
    setInputFileState(file);
  }, []);

  // Calculate isValidInput based on current state
  const isValidInput = useMemo(() => {
    if (mode === 'file') {
      return inputFile !== null && inputFile.size <= FILE_SIZE_LIMIT_MB * 1024 * 1024;
    }
    if (mode === 'text') {
      if (inputText.trim().length === 0) return false;
      if (direction === 'decode') {
        const normalized = normalizeInput(inputText);
        return isValidBase64(normalized, variant);
      }
      return true;
    }
    return false;
  }, [mode, inputFile, inputText, direction, variant]);

  // Main process function: encode/decode based on current state
  const process = useCallback(async () => {
    setError(null);

    if (mode === 'file' && inputFile) {
      setIsLoading(true);
      try {
        const result = await encodeFile(inputFile, variant);
        if (!result.ok) {
          setError(result.error);
          setOutputText('');
        } else {
          setOutputText(result.base64);
        }
      } catch (err) {
        setError({
          code: 'fileReadError',
          message: 'Unable to read file',
          details: err instanceof Error ? err.message : String(err),
        });
        setOutputText('');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'text' && inputText) {
      setIsLoading(true);
      try {
        if (direction === 'encode') {
          const result = safeEncode(inputText, variant);
          if (!result.ok) {
            setError(result.error);
            setOutputText('');
          } else {
            setOutputText(result.base64);
          }
        } else {
          const normalized = normalizeInput(inputText);
          const result = safeDecode(normalized, variant);
          if (!result.ok) {
            setError(result.error);
            setOutputText('');
          } else {
            setOutputText(result.plaintext);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [mode, inputFile, inputText, direction, variant]);

  // Debounced input text setter
  const setInputText = useCallback(
    (text: string) => {
      setInputTextState(text);
      setError(null);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Schedule process for large inputs (>10KB)
      if (text.length > 10 * 1024) {
        debounceTimerRef.current = setTimeout(
          () => process(),
          DEBOUNCE_MS
        );
      }
    },
    [process]
  );

  // Copy to clipboard
  const copy = useCallback(
    async (target: 'base64' | 'dataUri' | 'text'): Promise<boolean> => {
      let textToCopy = '';

      if (target === 'base64' && outputText && direction === 'encode') {
        textToCopy = outputText;
      } else if (target === 'dataUri' && outputText && direction === 'encode') {
        textToCopy = `data:text/plain;base64,${outputText}`;
      } else if (target === 'text' && outputText && direction === 'decode') {
        textToCopy = outputText;
      } else {
        return false;
      }

      try {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      } catch {
        // Silent failure
        return false;
      }
    },
    [outputText, direction]
  );

  // Download file
  const download = useCallback(
    (filename?: string) => {
      if (!outputText || !mode || direction !== 'encode') return;

      if (mode === 'file' && inputFile) {
        const result = decodeToBlob(outputText);
        if (result.ok) {
          const url = URL.createObjectURL(result.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || inputFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    },
    [outputText, mode, inputFile, direction]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  // Build state object with stable reference
  const state: Base64State = useMemo(
    () => ({
      mode,
      variant,
      direction,
      inputText,
      inputFile,
      outputText,
      isLoading,
      error,
      isValidInput,
    }),
    [mode, variant, direction, inputText, inputFile, outputText, isLoading, error, isValidInput]
  );

  // Build actions object with stable reference
  const actions: Base64Actions = useMemo(
    () => ({
      setMode,
      setVariant,
      setDirection,
      setInputText,
      setInputFile,
      process,
      copy,
      download,
    }),
    [setMode, setVariant, setDirection, setInputText, setInputFile, process, copy, download]
  );

  return [state, actions];
}
