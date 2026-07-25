import { renderHook, act, waitFor } from '@testing-library/react';
import { useBarcodeGenerator } from './useBarcodeGenerator';
import { loadBarcodeEncoder, encodeBarcode } from '@/lib/barcode-generator';

// Mock the domain functions
vi.mock('@/lib/barcode-generator', async () => {
  const actual = await vi.importActual('@/lib/barcode-generator');
  return {
    ...actual,
    loadBarcodeEncoder: vi.fn(async (format) => {
      // Return a mock encoder class with the same interface. valid() mirrors
      // jsbarcode's real EAN13/UPC checksum rule (last digit === '4' passes)
      // so validateChecksum's checksumError branch is exercised deterministically.
      return class MockEncoder {
        constructor(public data: string, public opts: any) {}
        encode() {
          return { data: this.data, text: this.data };
        }
        valid() {
          return this.data.endsWith('4');
        }
      };
    }),
    encodeBarcode: vi.fn((input, options, EncoderClass) => {
      const encoder = new EncoderClass(input.data, {});
      const encoded = encoder.encode();
      return {
        bars: '101010101010',
        svgString: '<svg></svg>',
        textContent: options.textVisible ? encoded.text : '',
        encodedValue: encoded.data,
        format: input.format,
      };
    }),
  };
});

describe('useBarcodeGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    expect(result.current.input).toBe('');
    expect(result.current.format).toBe('EAN13');
    expect(result.current.width).toBe(200);
    expect(result.current.textVisible).toBe(true);
    expect(result.current.encoded).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should update input', () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    act(() => {
      result.current.setInput('978014300723');
    });

    expect(result.current.input).toBe('978014300723');
  });

  it('should change format', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    act(() => {
      result.current.setFormat('CODE128');
    });

    expect(result.current.format).toBe('CODE128');
  });

  it('should update width', () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    act(() => {
      result.current.setWidth(250);
    });

    expect(result.current.width).toBe(250);
  });

  it('should toggle textVisible', () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    expect(result.current.textVisible).toBe(true);

    act(() => {
      result.current.setTextVisible(false);
    });

    expect(result.current.textVisible).toBe(false);
  });

  it('should encode valid EAN13 input', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    // Flush the mount-time async encoder load (a real microtask — fake timers
    // don't intercept it, only the debounce setTimeout below needs advancing).
    await act(async () => {});

    act(() => {
      result.current.setInput('978014300723');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.encoded).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle invalid input', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    await act(async () => {});

    act(() => {
      result.current.setInput('INVALID_EAN');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.encoded).toBeNull();
  });

  it('should reject a full-length EAN13 with a bad checksum digit (not silently encode it)', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    await act(async () => {});

    act(() => {
      // 13 digits (> the 12-digit base length) with a wrong final digit —
      // MockEncoder.valid() only passes when the value ends in '4'.
      result.current.setInput('9780143007233');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.error).toBe('checksumError');
    expect(result.current.encoded).toBeNull();
  });

  it('should accept a full-length EAN13 with a valid checksum digit', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    await act(async () => {});

    act(() => {
      result.current.setInput('9780143007234');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.encoded).not.toBeNull();
  });

  it('should save to localStorage', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    await act(async () => {});

    act(() => {
      result.current.setInput('123456789012');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    const stored = localStorage.getItem('jurepi-barcode-generator');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.recentInputs).toContain('123456789012');
    expect(parsed.lastFormat).toBe('EAN13');
  });

  it('should load from localStorage on mount', () => {
    const stored = {
      version: 1,
      recentInputs: ['978014300723'],
      lastFormat: 'CODE39',
      lastWidth: 250,
    };
    localStorage.setItem('jurepi-barcode-generator', JSON.stringify(stored));

    const { result } = renderHook(() => useBarcodeGenerator());

    expect(result.current.input).toBe('978014300723');
    expect(result.current.format).toBe('CODE39');
    expect(result.current.width).toBe(250);
  });

  it('should clear input when format changes', async () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    await act(async () => {});

    act(() => {
      result.current.setInput('978014300723');
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.input).toBe('978014300723');

    act(() => {
      result.current.setFormat('CODE128');
    });

    expect(result.current.input).toBe('');
  });

  it('does not let a stale (out-of-order) encoder-class response overwrite the latest format on rapid switching', async () => {
    // Both mocks are shared module-level vi.fn()s (see the vi.mock factory
    // above) — overriding their implementation here would otherwise leak
    // into every later test in this file, so restore both in `finally`.
    const originalLoadImpl = vi.mocked(loadBarcodeEncoder).getMockImplementation();
    const originalEncodeImpl = vi.mocked(encodeBarcode).getMockImplementation();

    let resolveUpc!: (cls: unknown) => void;
    let resolveCode39!: (cls: unknown) => void;
    const upcPromise = new Promise((resolve) => {
      resolveUpc = resolve;
    });
    const code39Promise = new Promise((resolve) => {
      resolveCode39 = resolve;
    });

    try {
      vi.mocked(loadBarcodeEncoder).mockImplementation((format: string) => {
        if (format === 'UPC') return upcPromise as Promise<unknown>;
        if (format === 'CODE39') return code39Promise as Promise<unknown>;
        return Promise.resolve(class MockEncoder {
          constructor(public data: string) {}
          encode() {
            return { data: this.data, text: this.data };
          }
          valid() {
            return true;
          }
        });
      });
      vi.mocked(encodeBarcode).mockImplementation((input: any, _options: any, EncoderClass: any) => ({
        bars: '101010101010',
        svgString: '<svg></svg>',
        textContent: EncoderClass.tag,
        encodedValue: EncoderClass.tag,
        format: input.format,
      }));

      const { result } = renderHook(() => useBarcodeGenerator());
      await act(async () => {});

      // Switch format twice in quick succession, before the first switch's
      // dynamic import has resolved.
      act(() => {
        result.current.setFormat('UPC');
      });
      act(() => {
        result.current.setFormat('CODE39');
      });

      // Resolve out of order: the *later* request (CODE39) settles first, then
      // the *earlier*, now-stale request (UPC) settles last.
      await act(async () => {
        resolveCode39(class {
          static tag = 'CODE39';
        });
      });
      await act(async () => {
        resolveUpc(class {
          static tag = 'UPC';
        });
      });

      act(() => {
        result.current.setInput('123456789');
      });
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Without the cancellation guard, the late-resolving UPC response would
      // overwrite encoderClassRef last and silently encode with the wrong class.
      expect(result.current.encoded?.encodedValue).toBe('CODE39');
      expect(result.current.format).toBe('CODE39');
    } finally {
      vi.mocked(loadBarcodeEncoder).mockImplementation(originalLoadImpl!);
      vi.mocked(encodeBarcode).mockImplementation(originalEncodeImpl!);
    }
  });

  it('should handle empty input', () => {
    const { result } = renderHook(() => useBarcodeGenerator());

    act(() => {
      result.current.setInput('');
    });

    expect(result.current.encoded).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
