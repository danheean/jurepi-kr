'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  detectBackgroundColor,
  applyTransparency,
  canvasToBlob,
  DOWNSCALE_THRESHOLD_PX,
  STORE_KEY,
  STORE_VERSION,
  type RGB,
  type RemovalOptions,
  type ProcessingPhase,
  transparentBgStoreSchema,
} from '@/lib/transparent-background';

interface UseTransparencyRemoverState {
  sourceFile: File | null;
  sourceImage: HTMLCanvasElement | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  bgColor: RGB;
  tolerance: number;
  feather: number;
  mode: 'flood-fill' | 'global';
  resultCanvas: HTMLCanvasElement | null;
  resultBlob: Blob | null;
  processingTimeMs: number | null;
  phase: ProcessingPhase;
  progress: number;
  error: string | null;
  isDownscaled: boolean;
}

interface UseTransparencyRemoverActions {
  uploadImage: (file: File) => Promise<void>;
  detectBackground: () => Promise<void>;
  updateOptions: (opts: Partial<{ tolerance: number; feather: number; mode: 'flood-fill' | 'global'; bgColor?: RGB }>) => void;
  exportPNG: () => Promise<Blob | null>;
  copyToClipboard: () => Promise<boolean>;
  reset: () => void;
}

const DEFAULT_BG_COLOR: RGB = { r: 255, g: 255, b: 255 };

export function useTransparencyRemover(): UseTransparencyRemoverState & UseTransparencyRemoverActions {
  // All hooks must be called unconditionally at the top level
  const [state, setState] = useState<UseTransparencyRemoverState>({
    sourceFile: null,
    sourceImage: null,
    sourceWidth: null,
    sourceHeight: null,
    bgColor: DEFAULT_BG_COLOR,
    tolerance: 50,
    feather: 2,
    mode: 'flood-fill',
    resultCanvas: null,
    resultBlob: null,
    processingTimeMs: null,
    phase: 'idle',
    progress: 0,
    error: null,
    isDownscaled: false,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const removalTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [mounted, setMounted] = useState(false);

  // Load persisted preferences from localStorage
  useEffect(() => {
    setMounted(true);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate using schema
          const result = transparentBgStoreSchema.safeParse(parsed);
          if (result.success) {
            const { tolerance, feather, mode, lastBgColor } = result.data;
            setState((prev) => ({
              ...prev,
              tolerance,
              feather,
              mode,
              bgColor: lastBgColor || DEFAULT_BG_COLOR,
            }));
          }
        }
      }
    } catch (err) {
      // Silently ignore localStorage errors
    }
  }, []);

  // Persist preferences to localStorage (debounced)
  useEffect(() => {
    if (!mounted) return;

    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const store = {
            tolerance: stateRef.current.tolerance,
            feather: stateRef.current.feather,
            mode: stateRef.current.mode,
            lastBgColor: stateRef.current.bgColor,
          };
          window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
        }
      } catch (err) {
        // Silently ignore localStorage errors
      }
    }, 500);

    return () => clearTimeout(persistTimerRef.current);
  }, [state.tolerance, state.feather, state.mode, state.bgColor, mounted]);

  const runDetectAndRemove = useCallback(async (canvas: HTMLCanvasElement) => {
    setState((prev) => ({ ...prev, phase: 'detecting' }));

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setState((prev) => ({
          ...prev,
          phase: 'error',
          error: 'processingFailed',
        }));
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detected = detectBackgroundColor(imageData);
      const bgColor = detected || DEFAULT_BG_COLOR;

      setState((prev) => ({
        ...prev,
        bgColor,
        phase: 'removing',
      }));

      // Apply removal with current options
      const opts: RemovalOptions = {
        bgColor,
        tolerance: stateRef.current.tolerance,
        feather: stateRef.current.feather,
        mode: stateRef.current.mode,
      };

      const startTime = performance.now();
      const resultImageData = await applyTransparency(imageData, opts.bgColor, opts.tolerance, opts.feather, opts.mode);

      // Render result to canvas
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = canvas.width;
      resultCanvas.height = canvas.height;
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Result canvas context failed');

      resultCtx.putImageData(resultImageData, 0, 0);

      const endTime = performance.now();

      setState((prev) => ({
        ...prev,
        resultCanvas,
        processingTimeMs: Math.round(endTime - startTime),
        phase: 'done',
        progress: 100,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: 'processingFailed',
      }));
    }
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, phase: 'uploading', error: null }));

    try {
      // Validate file format
      const supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        setState((prev) => ({
          ...prev,
          phase: 'error',
          error: 'unsupportedFormat',
        }));
        return;
      }

      // Read file and render to canvas
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          let isDownscaled = false;

          // Downscale if needed
          if (Math.max(width, height) > DOWNSCALE_THRESHOLD_PX) {
            const scale = DOWNSCALE_THRESHOLD_PX / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
            isDownscaled = true;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setState((prev) => ({
              ...prev,
              phase: 'error',
              error: 'processingFailed',
            }));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          setState((prev) => ({
            ...prev,
            sourceFile: file,
            sourceImage: canvas,
            sourceWidth: width,
            sourceHeight: height,
            isDownscaled,
          }));

          // Auto-detect and remove after upload
          runDetectAndRemove(canvas);
        };

        img.onerror = () => {
          setState((prev) => ({
            ...prev,
            phase: 'error',
            error: 'invalidImage',
          }));
        };

        img.src = reader.result as string;
      };

      reader.onerror = () => {
        setState((prev) => ({
          ...prev,
          phase: 'error',
          error: 'processingFailed',
        }));
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: 'processingFailed',
      }));
    }
  }, [runDetectAndRemove]);

  const detectBackground = useCallback(async () => {
    if (!stateRef.current.sourceImage) return;
    await runDetectAndRemove(stateRef.current.sourceImage);
  }, [runDetectAndRemove]);

  const applyRemovalLogic = useCallback(async (opts: RemovalOptions) => {
    if (!stateRef.current.sourceImage) return;

    const startTime = performance.now();
    setState((prev) => ({ ...prev, phase: 'removing' }));

    try {
      const canvas = stateRef.current.sourceImage;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const resultData = await applyTransparency(imageData, opts.bgColor, opts.tolerance, opts.feather, opts.mode);

      // Render result to a new canvas
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = canvas.width;
      resultCanvas.height = canvas.height;
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) throw new Error('Result canvas context failed');

      resultCtx.putImageData(resultData, 0, 0);

      const endTime = performance.now();

      setState((prev) => ({
        ...prev,
        resultCanvas,
        processingTimeMs: Math.round(endTime - startTime),
        phase: 'done',
        progress: 100,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        phase: 'error',
        error: 'processingFailed',
      }));
    }
  }, []);

  const updateOptions = useCallback((opts: Partial<{ tolerance: number; feather: number; mode: 'flood-fill' | 'global'; bgColor?: RGB }>) => {
    setState((prev) => {
      const updated = {
        ...prev,
        tolerance: opts.tolerance !== undefined ? opts.tolerance : prev.tolerance,
        feather: opts.feather !== undefined ? opts.feather : prev.feather,
        mode: opts.mode !== undefined ? opts.mode : prev.mode,
        bgColor: opts.bgColor !== undefined ? opts.bgColor : prev.bgColor,
      };

      // Trigger debounced removal with updated options
      if (removalTimerRef.current) {
        clearTimeout(removalTimerRef.current);
      }

      removalTimerRef.current = setTimeout(() => {
        const removalOpts: RemovalOptions = {
          bgColor: updated.bgColor,
          tolerance: updated.tolerance,
          feather: updated.feather,
          mode: updated.mode,
        };
        applyRemovalLogic(removalOpts).catch(() => {});
      }, 100);

      return updated;
    });
  }, [applyRemovalLogic]);

  const exportPNG = useCallback(async (): Promise<Blob | null> => {
    if (!stateRef.current.resultCanvas) return null;

    try {
      const blob = await canvasToBlob(stateRef.current.resultCanvas);
      setState((prev) => ({ ...prev, resultBlob: blob }));
      return blob;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: 'processingFailed',
      }));
      return null;
    }
  }, []);

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!stateRef.current.resultCanvas) return false;

    try {
      const blob = await canvasToBlob(stateRef.current.resultCanvas);
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      return true;
    } catch (err) {
      // Clipboard write can fail (unsupported browser, denied permission,
      // insecure context) — the caller surfaces this to the user instead of
      // showing a false "Copied!" success state.
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      sourceFile: null,
      sourceImage: null,
      sourceWidth: null,
      sourceHeight: null,
      bgColor: stateRef.current.bgColor,
      tolerance: stateRef.current.tolerance,
      feather: stateRef.current.feather,
      mode: stateRef.current.mode,
      resultCanvas: null,
      resultBlob: null,
      processingTimeMs: null,
      phase: 'idle',
      progress: 0,
      error: null,
      isDownscaled: false,
    });
  }, []);

  return {
    ...state,
    uploadImage,
    detectBackground,
    updateOptions,
    exportPNG,
    copyToClipboard,
    reset,
  };
}
