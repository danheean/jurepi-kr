'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  computeMetrics,
  createCustomLimit,
  getPresetLimit,
  DEBOUNCE_MS,
  STORAGE_MAX_LENGTH,
  DEFAULT_READ_WPM,
  DEFAULT_SPEAK_WPM,
  STORE_VERSION,
} from '@/lib/character-counter';
import type { CharacterCounterMetrics, PresetLimit, CounterStore } from '@/lib/character-counter';
import { z } from 'zod';

const counterStoreSchema = z.object({
  version: z.number(),
  lastText: z.string(),
  lastLimit: z
    .object({
      id: z.string(),
      limit: z.number().nullable(),
    })
    .nullable(),
  readWPM: z.number().default(DEFAULT_READ_WPM),
  speakWPM: z.number().default(DEFAULT_SPEAK_WPM),
});

export interface UseCharacterCounterReturn {
  // State
  text: string;
  metrics: CharacterCounterMetrics;
  limit: PresetLimit | null;
  customLimitInput: string;
  isLoading: boolean;

  // Actions
  setText: (text: string) => void;
  setLimit: (limit: PresetLimit | null) => void;
  setCustomLimitInput: (input: string) => void;
  clearText: () => void;
  copyText: () => Promise<void>;
  copyMetrics: () => Promise<void>;
}

const STORAGE_TEXT_KEY = 'jurepi-char-counter-text';
const STORAGE_LIMIT_KEY = 'jurepi-char-counter-limit';
const STORAGE_PREFS_KEY = 'jurepi-char-counter-prefs';

/**
 * Hook for character counter state, localStorage persistence, and clipboard adapters.
 * CRITICAL: Debounce refs are separate for compute vs persist to avoid conflicts.
 * Values are passed as arguments to debounced callbacks, NOT read from state (prevent stale closure).
 */
export function useCharacterCounter(): UseCharacterCounterReturn {
  // State
  const [text, setText] = useState('');
  const [metrics, setMetrics] = useState<CharacterCounterMetrics>(() => computeMetrics(''));
  const [limit, setLimit] = useState<PresetLimit | null>(null);
  const [customLimitInput, setCustomLimitInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Refs for latest values (safe to read in callbacks)
  const textRef = useRef(text);
  const metricsRef = useRef(metrics);
  const limitRef = useRef(limit);
  const customLimitInputRef = useRef(customLimitInput);

  // Separate debounce timers for compute and persist
  const computeTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const persistTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_TEXT_KEY);
      const storedLimit = localStorage.getItem(STORAGE_LIMIT_KEY);
      const storedPrefs = localStorage.getItem(STORAGE_PREFS_KEY);

      if (stored) {
        const loadedText = stored;
        setText(loadedText);
        textRef.current = loadedText;

        // Compute metrics immediately
        const newMetrics = computeMetrics(loadedText);
        setMetrics(newMetrics);
        metricsRef.current = newMetrics;
      }

      // Restore limit
      if (storedLimit) {
        try {
          const limitObj = JSON.parse(storedLimit);
          if (limitObj.id === 'custom' && limitObj.limit !== null) {
            setCustomLimitInput(String(limitObj.limit));
            customLimitInputRef.current = String(limitObj.limit);
            setLimit(createCustomLimit(limitObj.limit));
            limitRef.current = createCustomLimit(limitObj.limit);
          } else {
            const preset = getPresetLimit(limitObj.id);
            setLimit(preset);
            limitRef.current = preset;
          }
        } catch {
          // Invalid JSON, ignore
        }
      }

      // Restore preferences (for future: WPM customization)
      if (storedPrefs) {
        try {
          const prefsObj = JSON.parse(storedPrefs);
          // Currently unused, but reserved for future WPM settings
        } catch {
          // Invalid JSON, ignore
        }
      }
    } catch {
      // localStorage unavailable (private mode, quota, etc.), silently continue
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update refs whenever state changes (so callbacks have latest value).
   */
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  useEffect(() => {
    customLimitInputRef.current = customLimitInput;
  }, [customLimitInput]);

  /**
   * Debounced compute metrics: pass text as argument to avoid stale closure.
   */
  const scheduleComputeMetrics = useCallback((newText: string) => {
    if (computeTimerRef.current) {
      clearTimeout(computeTimerRef.current);
    }

    computeTimerRef.current = setTimeout(() => {
      const newMetrics = computeMetrics(newText);
      setMetrics(newMetrics);
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Debounced persist to localStorage: pass values as arguments.
   */
  const schedulePersist = useCallback(
    (textToSave: string, limitToSave: PresetLimit | null, customInputToSave: string) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }

      persistTimerRef.current = setTimeout(() => {
        try {
          if (textToSave.length <= STORAGE_MAX_LENGTH) {
            localStorage.setItem(STORAGE_TEXT_KEY, textToSave);
          }

          if (limitToSave) {
            localStorage.setItem(
              STORAGE_LIMIT_KEY,
              JSON.stringify({
                id: limitToSave.id,
                limit: limitToSave.limit,
              })
            );
          }

          // Persist custom input value if custom preset
          if (limitToSave?.id === 'custom' && customInputToSave) {
            // Already persisted via STORAGE_LIMIT_KEY
          }
        } catch {
          // localStorage unavailable (quota, private mode, etc.), silently continue
        }
      }, DEBOUNCE_MS);
    },
    []
  );

  /**
   * Set textarea text: compute metrics and persist.
   */
  const setTextValue = useCallback(
    (newText: string) => {
      setText(newText);
      scheduleComputeMetrics(newText);
      schedulePersist(newText, limitRef.current, customLimitInputRef.current);
    },
    [scheduleComputeMetrics, schedulePersist]
  );

  /**
   * Persist the limit IMMEDIATELY (not debounced). Limit selection is a small,
   * discrete user action — debouncing it loses the choice if the user reloads or
   * navigates within the debounce window. Text stays debounced (high-frequency).
   */
  const persistLimitImmediate = useCallback((limitToSave: PresetLimit | null) => {
    try {
      if (limitToSave) {
        localStorage.setItem(
          STORAGE_LIMIT_KEY,
          JSON.stringify({ id: limitToSave.id, limit: limitToSave.limit })
        );
      } else {
        localStorage.removeItem(STORAGE_LIMIT_KEY);
      }
    } catch {
      // localStorage unavailable (quota, private mode), silently continue
    }
  }, []);

  /**
   * Set limit preset or custom.
   */
  const setLimitValue = useCallback(
    (newLimit: PresetLimit | null) => {
      setLimit(newLimit);
      limitRef.current = newLimit;
      setCustomLimitInput('');
      customLimitInputRef.current = '';

      persistLimitImmediate(newLimit);
    },
    [persistLimitImmediate]
  );

  /**
   * Update custom limit input: parse and update limit object if valid.
   */
  const setCustomLimitInputValue = useCallback(
    (input: string) => {
      setCustomLimitInput(input);

      // Try to parse as number
      const num = parseInt(input, 10);
      if (!isNaN(num) && num > 0) {
        const customLimit = createCustomLimit(num);
        setLimit(customLimit);
        limitRef.current = customLimit;
        persistLimitImmediate(customLimit);
      } else if (input === '') {
        // Empty input, but keep custom preset selected (UI choice)
        setLimit(null);
        limitRef.current = null;
        persistLimitImmediate(null);
      }
    },
    [persistLimitImmediate]
  );

  /**
   * Clear textarea.
   */
  const clearTextValue = useCallback(() => {
    setText('');
    textRef.current = '';

    const newMetrics = computeMetrics('');
    setMetrics(newMetrics);
    metricsRef.current = newMetrics;

    // Debounce the persist
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_TEXT_KEY, '');
      } catch {
        // Silent fail
      }
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Copy text to clipboard (navigator.clipboard → execCommand fallback).
   */
  const copyTextValue = useCallback(async () => {
    const textToCopy = textRef.current;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback: execCommand
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Silent fail (copy is secondary)
    }
  }, []);

  /**
   * Copy metrics as formatted text.
   */
  const copyMetricsValue = useCallback(async () => {
    const m = metricsRef.current;
    const formatted = `Characters: ${m.charactersWithSpaces}
Characters (no spaces): ${m.charactersWithoutSpaces}
Words: ${m.words}
Sentences: ${m.sentences}
Paragraphs: ${m.paragraphs}
Lines: ${m.lines}
Bytes (UTF-8): ${m.byteSize}
Reading time: ${m.readingTimeMinutes} min
Speaking time: ${m.speakingTimeMinutes} min`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formatted);
      } else {
        // Fallback: execCommand
        const textarea = document.createElement('textarea');
        textarea.value = formatted;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Silent fail
    }
  }, []);

  return {
    text,
    metrics,
    limit,
    customLimitInput,
    isLoading,

    setText: setTextValue,
    setLimit: setLimitValue,
    setCustomLimitInput: setCustomLimitInputValue,
    clearText: clearTextValue,
    copyText: copyTextValue,
    copyMetrics: copyMetricsValue,
  };
}
