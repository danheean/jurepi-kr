import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  safeEncode,
  encodeFile,
  decodeToBlob,
  decodeSmart,
} from '@/lib/base64-encoder/encoder';
import { isDecodableInput } from '@/lib/base64-encoder/base64';
import { extensionForMime } from '@/lib/base64-encoder/mime';
import {
  DEBOUNCE_MS,
  FILE_SIZE_LIMIT_MB,
  STORAGE_KEY,
  type Base64EncoderError,
  type DecodedImage,
  type DecodedFile,
} from '@/lib/base64-encoder/schema';

/** Filename extension per detectable image MIME type. */
const IMAGE_MIME_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/svg+xml': 'svg',
};

export interface Base64State {
  mode: 'text' | 'file';
  variant: 'standard' | 'urlSafe';
  direction: 'encode' | 'decode';
  inputText: string;
  inputFile: File | null;
  outputText: string;
  /** Set when a text-mode decode yields an image; null otherwise. */
  decodedImage: DecodedImage | null;
  /** Set when a decode yields a non-image binary file (by declared MIME). */
  decodedFile: DecodedFile | null;
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
  downloadImage(filename?: string): void;
  copyImage(): Promise<boolean>;
  downloadDecodedFile(filename?: string): void;
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
  // Full `data:<mime>;base64,…` for the current encode output — carries the
  // real MIME (text/plain, image/png, application/pdf…) so "Copy Data-URI"
  // yields a valid, renderable URI instead of a hardcoded text/plain one.
  const [outputDataUri, setOutputDataUri] = useState('');
  const [decodedImage, setDecodedImage] = useState<DecodedImage | null>(null);
  const [decodedFile, setDecodedFile] = useState<DecodedFile | null>(null);
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
        // Mirror decodeSmart's acceptance: strip data: URLs and accept either
        // variant, so a pasted data URI (or mismatched-variant Base64) reaches
        // the decoder instead of being silently dropped by this gate.
        return isDecodableInput(inputText, variant);
      }
      return true;
    }
    return false;
  }, [mode, inputFile, inputText, direction, variant]);

  // Main process function: encode/decode based on current state
  const process = useCallback(async () => {
    setError(null);
    setDecodedImage(null);
    setDecodedFile(null);
    setOutputDataUri('');

    if (mode === 'file' && inputFile) {
      setIsLoading(true);
      try {
        const result = await encodeFile(inputFile, variant);
        if (!result.ok) {
          setError(result.error);
          setOutputText('');
        } else {
          setOutputText(result.base64);
          // Real MIME (image/png, application/pdf, …) from the file.
          setOutputDataUri(result.dataUri);
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
            setOutputDataUri(result.dataUri); // data:text/plain;base64,…
          }
        } else {
          const result = decodeSmart(inputText, variant);
          if (!result.ok) {
            setError(result.error);
            setOutputText('');
          } else if (result.kind === 'image') {
            // Show the decoded image instead of garbled text.
            setOutputText('');
            setDecodedImage({
              mimeType: result.mimeType,
              base64: result.base64,
              dataUri: result.dataUri,
              sizeBytes: result.sizeBytes,
            });
          } else if (result.kind === 'file') {
            // Declared binary (PDF, zip, …): offer a file download.
            setOutputText('');
            setDecodedFile({
              mimeType: result.mimeType,
              base64: result.base64,
              sizeBytes: result.sizeBytes,
            });
          } else {
            setOutputText(result.plaintext);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [mode, inputFile, inputText, direction, variant]);

  // Input text setter — conversion is driven by the live effect below.
  const setInputText = useCallback((text: string) => {
    setInputTextState(text);
    setError(null);
  }, []);

  // Keep a live ref to the latest process closure so the live-conversion
  // effect always fires the current one (avoids the debounce stale-closure trap).
  const processRef = useRef(process);
  useEffect(() => {
    processRef.current = process;
  });

  // Live conversion (SPEC): output tracks input/settings in real time.
  // Large text (>10KB) is debounced; empty or invalid input clears the output.
  useEffect(() => {
    const hasInput =
      mode === 'file' ? inputFile !== null : inputText.trim().length > 0;

    if (!hasInput || !isValidInput) {
      setOutputText('');
      setOutputDataUri('');
      setDecodedImage(null);
      setDecodedFile(null);
      setError(null);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    if (mode === 'text' && inputText.length > 10 * 1024) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => processRef.current(), DEBOUNCE_MS);
      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }

    processRef.current();
  }, [mode, inputText, inputFile, direction, variant, isValidInput]);

  // Copy to clipboard
  const copy = useCallback(
    async (target: 'base64' | 'dataUri' | 'text'): Promise<boolean> => {
      let textToCopy = '';

      if (target === 'base64' && outputText && direction === 'encode') {
        textToCopy = outputText;
      } else if (target === 'dataUri' && outputDataUri && direction === 'encode') {
        // Use the encoder-produced data URI so the MIME matches the content
        // (image/png, application/pdf, text/plain, …) — not a hardcoded type.
        textToCopy = outputDataUri;
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
    [outputText, outputDataUri, direction]
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

  // Download the decoded image as a file.
  const downloadImage = useCallback(
    (filename?: string) => {
      if (!decodedImage) return;
      const result = decodeToBlob(decodedImage.base64, decodedImage.mimeType);
      if (!result.ok) return;
      const ext = IMAGE_MIME_EXTENSION[decodedImage.mimeType] ?? 'bin';
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `decoded.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [decodedImage]
  );

  // Download the decoded (non-image) binary file, named by its MIME extension.
  const downloadDecodedFile = useCallback(
    (filename?: string) => {
      if (!decodedFile) return;
      const result = decodeToBlob(decodedFile.base64, decodedFile.mimeType);
      if (!result.ok) return;
      const ext = extensionForMime(decodedFile.mimeType);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `decoded.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [decodedFile]
  );

  // Copy the decoded image to the clipboard (best-effort; browser support varies).
  const copyImage = useCallback(async (): Promise<boolean> => {
    if (!decodedImage) return false;
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      return false;
    }
    const result = decodeToBlob(decodedImage.base64, decodedImage.mimeType);
    if (!result.ok) return false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [decodedImage.mimeType]: result.blob }),
      ]);
      return true;
    } catch {
      return false;
    }
  }, [decodedImage]);

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
      decodedImage,
      decodedFile,
      isLoading,
      error,
      isValidInput,
    }),
    [mode, variant, direction, inputText, inputFile, outputText, decodedImage, decodedFile, isLoading, error, isValidInput]
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
      downloadImage,
      copyImage,
      downloadDecodedFile,
    }),
    [setMode, setVariant, setDirection, setInputText, setInputFile, process, copy, download, downloadImage, copyImage, downloadDecodedFile]
  );

  return [state, actions];
}
