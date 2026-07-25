'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarcodeFormat,
  BarcodeOptions,
  EncodedBarcode,
  BarcodeErrorCode,
  validateInput,
  validateChecksum,
  encodeBarcode,
  loadBarcodeEncoder,
  BarcodeStoreSchema,
} from '@/lib/barcode-generator';

interface BarcodeGeneratorState {
  input: string;
  format: BarcodeFormat;
  width: number;
  textVisible: boolean;
  encoded: EncodedBarcode | null;
  error: BarcodeErrorCode | null;
  isLoading: boolean;
}

const STORE_KEY = 'jurepi-barcode-generator';
const DEBOUNCE_MS = 100;
const WIDTH_DEFAULT = 200;
const MAX_INPUT_LENGTH = 256;

export function useBarcodeGenerator() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<BarcodeFormat>('EAN13');
  const [width, setWidth] = useState(WIDTH_DEFAULT);
  const [textVisible, setTextVisible] = useState(true);
  const [encoded, setEncoded] = useState<EncodedBarcode | null>(null);
  const [error, setError] = useState<BarcodeErrorCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const encoderClassRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mount: load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORE_KEY);
    if (stored) {
      const parsed = BarcodeStoreSchema.safeParse(JSON.parse(stored));
      if (parsed.success) {
        const { recentInputs, lastFormat, lastWidth } = parsed.data;
        setFormat(lastFormat);
        setWidth(lastWidth);
        if (recentInputs.length > 0) {
          setInput(recentInputs[0]);
        }
      }
    }
  }, []);

  // Load encoder when format changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadBarcodeEncoder(format)
      .then((EncoderClass) => {
        encoderClassRef.current = EncoderClass;
        setIsLoading(false);
      })
      .catch(() => {
        setError('encodingFailed');
        setIsLoading(false);
      });
  }, [format]);

  // Debounced encode
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!input.trim()) {
      setEncoded(null);
      setError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const validation = validateInput({ data: input, format });
      if (!validation.valid) {
        setError(validation.error?.code ?? null);
        setEncoded(null);
        return;
      }

      try {
        if (!encoderClassRef.current) {
          setError('encodingFailed');
          return;
        }

        // Full-length EAN13/UPC input carries its own checksum digit — verify it
        // rather than silently encoding whatever digit the user typed. jsbarcode's
        // constructor only *appends* a checksum for base-length input; it does not
        // validate a checksum that's already present, so this check would otherwise
        // never run and a mistyped checksum would render as if it were valid.
        if (format === 'EAN13' || format === 'UPC') {
          const baseLength = format === 'EAN13' ? 12 : 11;
          if (
            input.length > baseLength &&
            !validateChecksum({ data: input, format }, encoderClassRef.current)
          ) {
            setError('checksumError');
            setEncoded(null);
            return;
          }
        }

        const result = encodeBarcode(
          { data: input, format },
          { width, textVisible },
          encoderClassRef.current
        );

        setEncoded(result);
        setError(null);
      } catch (err) {
        setError('encodingFailed');
        setEncoded(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [input, format, width, textVisible]);

  // Save to localStorage on state change
  useEffect(() => {
    const store = {
      version: 1,
      recentInputs: input.trim() ? [input.substring(0, 100)] : [],
      lastFormat: format,
      lastWidth: width,
    };
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      // Silently ignore (storage unavailable)
    }
  }, [input, format, width]);

  const handleSetFormat = useCallback((newFormat: BarcodeFormat) => {
    setFormat(newFormat);
    setInput('');
    setError(null);
  }, []);

  return {
    input,
    setInput,
    format,
    setFormat: handleSetFormat,
    width,
    setWidth,
    textVisible,
    setTextVisible,
    encoded,
    error,
    isLoading,
  };
}
