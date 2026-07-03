import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQRCode } from './useQRCode';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useQRCode.ts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useQRCode());
      const [state] = result.current;

      expect(state.input).toBe('');
      expect(state.mode).toBe('text');
      expect(state.options.eccLevel).toBe('M');
      expect(state.options.size).toBe(300);
      expect(state.options.quietZone).toBe(4);
      expect(state.options.fgColor).toBe('#2a2411');
      expect(state.options.bgColor).toBe('#ffffff');
      expect(state.logoUrl).toBeUndefined();
      expect(state.recentInputs).toEqual([]);
      expect(state.isEncoding).toBe(false);
      expect(state.error).toBeUndefined();
    });

    it('restores state from localStorage on mount', async () => {
      localStorage.setItem(
        'jurepi-qr-code',
        JSON.stringify({
          version: 1,
          recentInputs: ['saved1', 'saved2'],
          lastMode: 'url',
          lastECC: 'H',
          lastFgColor: '#ff0000',
          lastBgColor: '#00ff00',
        })
      );

      const { result } = renderHook(() => useQRCode());

      await waitFor(() => {
        const [state] = result.current;
        expect(state.recentInputs).toEqual(['saved1', 'saved2']);
      });
    });

    it('starts fresh if localStorage is corrupt', async () => {
      localStorage.setItem('jurepi-qr-code', 'invalid json {{{');

      const { result } = renderHook(() => useQRCode());

      await waitFor(() => {
        const [state] = result.current;
        expect(state.recentInputs).toEqual([]);
      });
    });
  });

  describe('setInput', () => {
    it('updates input text', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('Hello World');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.input).toBe('Hello World');
      });
    });

    it('truncates input to MAX_INPUT_LENGTH', async () => {
      const { result } = renderHook(() => useQRCode());
      const tooLong = 'a'.repeat(3000);

      act(() => {
        const [, actions] = result.current;
        actions.setInput(tooLong);
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.input.length).toBeLessThanOrEqual(2953);
      });
    });
  });

  describe('setMode', () => {
    it('changes input mode', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setMode('url');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.mode).toBe('url');
      });
    });

    it('triggers re-encode on mode change', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('https://jurepi.kr');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.input).toBe('https://jurepi.kr');
      });

      act(() => {
        const [, actions] = result.current;
        actions.setMode('url');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.mode).toBe('url');
        // Result should be computed for new mode
        expect(state.result).toBeDefined();
      });
    });
  });

  describe('setOptions', () => {
    it('updates ECC level', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setOptions({ eccLevel: 'H' });
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.options.eccLevel).toBe('H');
      });
    });

    it('updates size', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setOptions({ size: 400 });
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.options.size).toBe(400);
      });
    });

    it('updates colors', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setOptions({ fgColor: '#ff0000', bgColor: '#00ff00' });
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.options.fgColor).toBe('#ff0000');
        expect(state.options.bgColor).toBe('#00ff00');
      });
    });

    it('merges options (preserves unspecified)', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setOptions({ eccLevel: 'L' });
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.options.eccLevel).toBe('L');
        expect(state.options.size).toBe(300); // unchanged
      });
    });
  });

  describe('setLogoUrl', () => {
    it('sets logo URL', async () => {
      const { result } = renderHook(() => useQRCode());
      const dataUrl = 'data:image/png;base64,abc';

      act(() => {
        const [, actions] = result.current;
        actions.setLogoUrl(dataUrl);
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.logoUrl).toBe(dataUrl);
      });
    });

    it('clears logo with undefined', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setLogoUrl('data:image/png;base64,abc');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.logoUrl).toBeDefined();
      });

      act(() => {
        const [, actions] = result.current;
        actions.setLogoUrl(undefined);
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.logoUrl).toBeUndefined();
      });
    });
  });

  describe('encoding and result', () => {
    it('generates QR matrix for simple text', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('Hello');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.result).toBeDefined();
        expect(state.result?.matrix).toBeDefined();
        expect(Array.isArray(state.result?.matrix)).toBe(true);
      });
    });

    it('generates SVG for QR code', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('Test');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.result?.svg).toBeDefined();
        expect(state.result?.svg).toMatch(/^<svg/);
        expect(state.result?.svg).toMatch(/<\/svg>$/);
      });
    });

    it('calculates contrast acceptability', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('QR');
        // Black on white should have high contrast
        actions.setOptions({ fgColor: '#000000', bgColor: '#ffffff' });
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.result?.contrastAcceptable).toBe(true);
      });
    });

    it('detects low contrast', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('QR');
        // Similar colors = low contrast
        actions.setOptions({ fgColor: '#cccccc', bgColor: '#dddddd' });
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.result?.contrastAcceptable).toBe(false);
      });
    });
  });

  describe('recentInputs persistence', () => {
    it('adds input to recent list', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.addRecent('test input');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.recentInputs).toContain('test input');
      });
    });

    it('deduplicates recent inputs', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.addRecent('test');
        actions.addRecent('test');
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.recentInputs.filter((v) => v === 'test')).toHaveLength(1);
      });
    });

    it('limits recent inputs to 5', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        for (let i = 0; i < 10; i++) {
          actions.addRecent(`input${i}`);
        }
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.recentInputs.length).toBeLessThanOrEqual(5);
      });
    });

    it('persists recent inputs to localStorage', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.addRecent('persisted');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('jurepi-qr-code');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.recentInputs).toContain('persisted');
      });
    });

    it('truncates long recent inputs to 100 chars', async () => {
      const { result } = renderHook(() => useQRCode());
      const longInput = 'a'.repeat(150);

      act(() => {
        const [, actions] = result.current;
        actions.addRecent(longInput);
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.recentInputs[0].length).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('error handling', () => {
    it('handles empty input gracefully', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('');
      });

      await waitFor(() => {
        const [state] = result.current;
        // Empty input should not generate QR (result remains undefined)
        expect(state.result?.matrix).toBeUndefined();
      });
    });

    it('sets error on invalid input', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('a'.repeat(3000)); // Too long
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.error).toBeDefined();
      });
    });

    it('clears error when clearError is called', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('a'.repeat(3000)); // Too long to trigger error
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.error).toBeDefined();
      });

      act(() => {
        const [, actions] = result.current;
        actions.clearError();
      });

      await waitFor(() => {
        const [state] = result.current;
        expect(state.error).toBeUndefined();
      });
    });
  });

  describe('debouncing', () => {
    it('encodes after input stabilizes', async () => {
      const { result } = renderHook(() => useQRCode());

      act(() => {
        const [, actions] = result.current;
        actions.setInput('test');
      });

      // Wait for debounce and encoding
      await waitFor(
        () => {
          const [state] = result.current;
          expect(state.result?.matrix).toBeDefined();
        },
        { timeout: 300 }
      );
    });
  });
});
