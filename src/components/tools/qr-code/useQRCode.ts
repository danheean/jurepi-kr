'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  encodeQRMatrix,
  formatData,
  isContrastAcceptable,
  matrixToSvg,
  qrCodeStoreSchema,
  qrOptionsSchema,
  STORE_KEY,
  DEBOUNCE_MS,
  MAX_INPUT_LENGTH,
} from '@/lib/qr-code';
import type {
  InputMode,
  ECCLevel,
  QROptions,
  QRGenerationResult,
  WifiFields,
  VcardFields,
  EmailFields,
  SmsFields,
} from '@/lib/qr-code';

interface UseQRCodeState {
  input: string;
  mode: InputMode;
  options: QROptions;
  logoUrl?: string;
  result?: QRGenerationResult;
  isEncoding: boolean;
  error?: Error;
  recentInputs: string[];
}

interface UseQRCodeActions {
  setInput: (v: string) => void;
  setMode: (m: InputMode) => void;
  setOptions: (opts: Partial<QROptions>) => void;
  setLogoUrl: (url?: string) => void;
  addRecent: (text: string) => void;
  clearError: () => void;
}

/**
 * Encode QR data based on the current mode and fields.
 */
function encodeQRData(
  mode: InputMode,
  input: string
): string {
  if (mode === 'text' || mode === 'url') {
    return input;
  }

  // For structured modes, parse input as JSON fields
  // In the UI layer, the component will populate these correctly
  // For now, we'll handle simple text mode; structured modes are UI-level
  return input;
}

export function useQRCode(): [UseQRCodeState, UseQRCodeActions] {
  const [state, setState] = useState<UseQRCodeState>({
    input: '',
    mode: 'text',
    options: {
      eccLevel: 'M',
      size: 300,
      quietZone: 4,
      fgColor: '#2a2411',
      bgColor: '#ffffff',
    },
    logoUrl: undefined,
    result: undefined,
    isEncoding: false,
    error: undefined,
    recentInputs: [],
  });

  // Always-current snapshot of state for stable callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Unique request ID to drop stale results
  const reqIdRef = useRef(0);

  // Mount flag for localStorage operations
  const [mounted, setMounted] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    let loadedStore = {
      recentInputs: [] as string[],
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORE_KEY);
        if (stored) {
          const parsed = qrCodeStoreSchema.safeParse(JSON.parse(stored));
          if (parsed.success) {
            loadedStore.recentInputs = parsed.data.recentInputs;
          }
        }
      }
    } catch {
      // Silent fail: use defaults
    }

    setState((prev) => ({
      ...prev,
      recentInputs: loadedStore.recentInputs,
    }));
    setMounted(true);
  }, []);

  // Persist recentInputs whenever they change (after mount)
  useEffect(() => {
    if (!mounted) return;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const store = {
          version: 1,
          recentInputs: state.recentInputs,
          lastMode: state.mode,
          lastECC: state.options.eccLevel,
          lastFgColor: state.options.fgColor,
          lastBgColor: state.options.bgColor,
        };
        const validated = qrCodeStoreSchema.safeParse(store);
        if (validated.success) {
          window.localStorage.setItem(STORE_KEY, JSON.stringify(validated.data));
        }
      }
    } catch {
      // Silent fail: storage unavailable
    }
  }, [state.recentInputs, state.mode, state.options, mounted]);

  // Live debounced encoding
  useEffect(() => {
    const { input, mode, options } = state;

    if (!input.trim()) {
      setState((prev) => ({
        ...prev,
        result: undefined,
        isEncoding: false,
        error: undefined,
      }));
      return;
    }

    const reqId = ++reqIdRef.current;
    setState((prev) => (prev.isEncoding ? prev : { ...prev, isEncoding: true }));

    const timer = setTimeout(() => {
      try {
        // Format data per mode
        const formatted = encodeQRData(mode, input);

        // Encode to matrix
        const matrix = encodeQRMatrix(formatted, options.eccLevel);

        // Generate SVG
        const svg = matrixToSvg(matrix, {
          size: options.size,
          quietZone: options.quietZone,
          fgColor: options.fgColor,
          bgColor: options.bgColor,
        });

        // Check contrast
        const contrastAcceptable = isContrastAcceptable(
          options.fgColor,
          options.bgColor,
          50
        );

        if (reqId !== reqIdRef.current) return; // Superseded

        setState((prev) => ({
          ...prev,
          result: { matrix, svg, contrastAcceptable },
          isEncoding: false,
          error: undefined,
        }));
      } catch (err: unknown) {
        if (reqId !== reqIdRef.current) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setState((prev) => ({
          ...prev,
          result: undefined,
          isEncoding: false,
          error,
        }));
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [state.input, state.mode, state.options]);

  const setInput = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      input: text.slice(0, MAX_INPUT_LENGTH),
    }));
  }, []);

  const setMode = useCallback((m: InputMode) => {
    setState((prev) => ({ ...prev, mode: m }));
  }, []);

  const setOptions = useCallback((opts: Partial<QROptions>) => {
    setState((prev) => ({
      ...prev,
      options: { ...prev.options, ...opts },
    }));
  }, []);

  const setLogoUrl = useCallback((url?: string) => {
    setState((prev) => ({ ...prev, logoUrl: url }));
  }, []);

  const addRecent = useCallback((text: string) => {
    if (!text.trim()) return;

    setState((prev) => {
      const truncated = text.slice(0, 100);
      const existing = prev.recentInputs.filter((item) => item !== truncated);
      const updated = [truncated, ...existing].slice(0, 5);
      return { ...prev, recentInputs: updated };
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  return [
    state,
    {
      setInput,
      setMode,
      setOptions,
      setLogoUrl,
      addRecent,
      clearError,
    },
  ];
}
