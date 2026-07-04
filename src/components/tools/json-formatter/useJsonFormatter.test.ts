import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJsonFormatter } from './useJsonFormatter';
import * as jsonFormatterLib from '@/lib/json-formatter';

// Mock the domain library
vi.mock('@/lib/json-formatter', async () => {
  const actual = await vi.importActual('@/lib/json-formatter');
  return actual;
});

describe('useJsonFormatter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('initializes with empty input and defaults', () => {
      const { result } = renderHook(() => useJsonFormatter());
      const [state] = result.current;

      expect(state.input).toBe('');
      expect(state.indent).toBe('2');
      expect(state.sortKeys).toBe(false);
      expect(state.parseResult.success).toBe(false); // Empty input is invalid
      expect(state.stats).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('loads preferences from localStorage', () => {
      localStorage.setItem(
        'jurepi-json-formatter',
        JSON.stringify({
          version: 1,
          indent: '4',
          sortKeys: true,
        })
      );

      const { result } = renderHook(() => useJsonFormatter());
      const [state] = result.current;

      expect(state.indent).toBe('4');
      expect(state.sortKeys).toBe(true);
    });

    it('handles invalid localStorage gracefully', () => {
      localStorage.setItem('jurepi-json-formatter', 'invalid json');

      const { result } = renderHook(() => useJsonFormatter());
      const [state] = result.current;

      expect(state.indent).toBe('2');
      expect(state.sortKeys).toBe(false);
    });
  });

  describe('setInput', () => {
    it('updates input immediately (draft state)', async () => {
      const { result } = renderHook(() => useJsonFormatter());
      const [initialState, { setInput }] = result.current;

      expect(initialState.input).toBe('');

      act(() => {
        setInput('{"test": 1}');
      });

      const [newState] = result.current;
      expect(newState.input).toBe('{"test": 1}');
    });

    it('debounces parse on input change (200ms)', async () => {
      const { result } = renderHook(() => useJsonFormatter());
      const [, { setInput }] = result.current;

      act(() => {
        setInput('{"valid": true}');
      });

      // Immediately after setInput, parse result should not be updated yet
      expect(result.current[0].parseResult.success).toBe(false);

      // Wait for debounce
      await waitFor(
        () => {
          expect(result.current[0].parseResult.success).toBe(true);
        },
        { timeout: 300 }
      );
    });

    it('accepts draft input with trailing comma (before parse)', async () => {
      const { result } = renderHook(() => useJsonFormatter());
      const [, { setInput }] = result.current;

      act(() => {
        setInput('{"a": 1, }');
      });

      // Input should be updated immediately
      expect(result.current[0].input).toBe('{"a": 1, }');

      // After debounce, parse should fail
      await waitFor(
        () => {
          expect(result.current[0].parseResult.success).toBe(false);
        },
        { timeout: 300 }
      );
    });
  });

  describe('setIndent', () => {
    it('updates indent option', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setIndent('4');
      });

      expect(result.current[0].indent).toBe('4');
    });

    it('persists indent to localStorage', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setIndent('tab');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('jurepi-json-formatter');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.indent).toBe('tab');
      });
    });

    it('re-parses with new indent on next input', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"a": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      const output1 = result.current[0].parseResult.output || '';

      act(() => {
        result.current[1].setIndent('4');
      });

      // Trigger re-parse by changing input
      act(() => {
        result.current[1].setInput('{"a": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.output).not.toBe(output1);
      });
    });
  });

  describe('toggleSortKeys', () => {
    it('toggles sortKeys option', () => {
      const { result } = renderHook(() => useJsonFormatter());

      expect(result.current[0].sortKeys).toBe(false);

      act(() => {
        result.current[1].toggleSortKeys();
      });

      expect(result.current[0].sortKeys).toBe(true);

      act(() => {
        result.current[1].toggleSortKeys();
      });

      expect(result.current[0].sortKeys).toBe(false);
    });

    it('persists sortKeys to localStorage', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].toggleSortKeys();
      });

      await waitFor(() => {
        const stored = localStorage.getItem('jurepi-json-formatter');
        const parsed = JSON.parse(stored!);
        expect(parsed.sortKeys).toBe(true);
      });
    });

    it('re-parses on toggle when input is valid', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"z": 1, "a": 2}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      const outputBefore = result.current[0].parseResult.output;

      act(() => {
        result.current[1].toggleSortKeys();
      });

      // Sort should change output
      await waitFor(() => {
        expect(result.current[0].parseResult.output).not.toBe(outputBefore);
        expect(result.current[0].parseResult.output).toContain('"a":');
      });
    });
  });

  describe('format', () => {
    it('formats current input with current options', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"b":1,"a":2}');
        result.current[1].setIndent('2');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      act(() => {
        result.current[1].format();
      });

      const output = result.current[0].parseResult.output;
      expect(output).toContain('  "b": 1');
      expect(output).toContain('  "a": 2');
    });

    it('applies sort keys if enabled', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"z":1,"a":2}');
        result.current[1].toggleSortKeys();
        result.current[1].format();
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      const output = result.current[0].parseResult.output ?? '';
      expect(output).not.toBe('');
      expect(output.indexOf('"a"')).toBeLessThan(output.indexOf('"z"'));
    });
  });

  describe('minify', () => {
    it('minifies current input', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"a": 1, "b": 2}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      act(() => {
        result.current[1].minify();
      });

      const output = result.current[0].parseResult.output;
      expect(output).not.toContain('\n');
      expect(output).toBe('{"a":1,"b":2}');
    });
  });

  describe('clear', () => {
    it('clears input and resets to empty state', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"test": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].input).toBe('{"test": 1}');
      });

      act(() => {
        result.current[1].clear();
      });

      expect(result.current[0].input).toBe('');
      expect(result.current[0].parseResult.success).toBe(false);
    });
  });

  describe('loadFromUrl', () => {
    it('loads JSON from valid URL', async () => {
      const mockFetch = vi.fn(async () => ({
        ok: true,
        headers: new Headers(),
        text: async () => '{"loaded": true}',
      }));

      const { result } = renderHook(() => useJsonFormatter());

      // Mock the fetch
      global.fetch = mockFetch as any;

      act(() => {
        result.current[1].loadFromUrl('https://api.example.com/data.json');
      });

      await waitFor(
        () => {
          expect(result.current[0].isLoading).toBe(false);
          expect(result.current[0].input).toBe('{"loaded": true}');
        },
        { timeout: 500 }
      );
    });

    it('sets error on invalid URL', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].loadFromUrl('not a url');
      });

      await waitFor(() => {
        expect(result.current[0].error).not.toBeNull();
        expect(result.current[0].error?.code).toBe('invalid_url');
      });
    });

    it('does not clear existing input on error', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"existing": "data"}');
      });

      act(() => {
        result.current[1].loadFromUrl('not a url');
      });

      await waitFor(() => {
        expect(result.current[0].input).toBe('{"existing": "data"}');
        expect(result.current[0].error).not.toBeNull();
      });
    });

    it('shows loading state while fetching', async () => {
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => {
                resolve({
                  ok: true,
                  headers: new Headers(),
                  text: async () => '{"test": 1}',
                } as any);
              },
              100
            );
          })
      );

      const { result } = renderHook(() => useJsonFormatter());
      global.fetch = mockFetch as any;

      act(() => {
        result.current[1].loadFromUrl('https://api.example.com/data.json');
      });

      expect(result.current[0].isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });
    });
  });

  describe('copyFormatted', () => {
    it('copies formatted output to clipboard', async () => {
      const mockWriteText = vi.fn(async () => {});
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"test": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      const success = await act(async () => {
        return result.current[1].copyFormatted();
      });

      expect(success).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('"test"')
      );
    });

    it('returns false if no valid output', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      const success = await act(async () => {
        return result.current[1].copyFormatted();
      });

      expect(success).toBe(false);
    });
  });

  describe('downloadJson', () => {
    it('does nothing if no valid output', () => {
      const { result } = renderHook(() => useJsonFormatter());

      // Should not throw even with empty state
      expect(() => {
        result.current[1].downloadJson('test.json');
      }).not.toThrow();
    });

    it('triggers download with custom filename', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"test": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });

      // Should not throw (Blob/download works in jsdom with graceful fallback)
      expect(() => {
        result.current[1].downloadJson('custom.json');
      }).not.toThrow();
    });
  });

  describe('stable callback references', () => {
    it('returns same callback reference on re-renders', () => {
      const { result, rerender } = renderHook(() => useJsonFormatter());
      const [, actions1] = result.current;

      rerender();

      const [, actions2] = result.current;

      expect(actions1.setInput).toBe(actions2.setInput);
      expect(actions1.format).toBe(actions2.format);
      expect(actions1.minify).toBe(actions2.minify);
    });
  });

  describe('error recovery', () => {
    it('recovers from parse error to valid JSON', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"invalid": }');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(false);
      });

      act(() => {
        result.current[1].setInput('{"valid": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].parseResult.success).toBe(true);
      });
    });

    it('calculates stats only on valid JSON', async () => {
      const { result } = renderHook(() => useJsonFormatter());

      act(() => {
        result.current[1].setInput('{"invalid":}');
      });

      await waitFor(() => {
        expect(result.current[0].stats).toBeNull();
      });

      act(() => {
        result.current[1].setInput('{"valid": 1}');
      });

      await waitFor(() => {
        expect(result.current[0].stats).not.toBeNull();
        expect(result.current[0].stats?.elementCount).toBeGreaterThan(0);
      });
    });
  });
});
