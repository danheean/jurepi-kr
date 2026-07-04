import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBase64 } from './useBase64';
import { STORAGE_KEY } from '@/lib/base64-encoder/schema';

describe('useBase64 hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('returns default state on first mount', () => {
      const { result } = renderHook(() => useBase64());
      const [state] = result.current;

      expect(state.mode).toBe('text');
      expect(state.variant).toBe('standard');
      expect(state.direction).toBe('encode');
      expect(state.inputText).toBe('');
      expect(state.inputFile).toBeNull();
      expect(state.outputText).toBe('');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('restores persisted mode and variant from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode: 'file', variant: 'urlSafe' })
      );

      const { result } = renderHook(() => useBase64());
      const [state] = result.current;

      expect(state.mode).toBe('file');
      expect(state.variant).toBe('urlSafe');
    });

    it('ignores malformed localStorage data', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      const { result } = renderHook(() => useBase64());
      const [state] = result.current;

      expect(state.mode).toBe('text');
      expect(state.variant).toBe('standard');
    });

    it('ignores invalid mode/variant values in localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode: 'invalid', variant: 'unknown' })
      );

      const { result } = renderHook(() => useBase64());
      const [state] = result.current;

      expect(state.mode).toBe('text');
      expect(state.variant).toBe('standard');
    });
  });

  describe('setMode', () => {
    it('switches mode and clears opposite input', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setInputText('hello world');
      });

      let state = result.current[0];
      expect(state.inputText).toBe('hello world');

      act(() => {
        actions.setMode('file');
      });

      state = result.current[0];
      expect(state.mode).toBe('file');
      expect(state.inputText).toBe('');
    });

    it('persists mode to localStorage', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setMode('file');
        vi.advanceTimersByTime(100);
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeDefined();
      if (stored) {
        const prefs = JSON.parse(stored);
        expect(prefs.mode).toBe('file');
      }
    });

    it('clears file input when switching to text mode', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      act(() => {
        actions.setMode('file');
        actions.setInputFile(mockFile);
      });

      let state = result.current[0];
      expect(state.inputFile).toBe(mockFile);

      act(() => {
        actions.setMode('text');
      });

      state = result.current[0];
      expect(state.inputFile).toBeNull();
    });
  });

  describe('setVariant', () => {
    it('switches variant and persists to localStorage', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setVariant('urlSafe');
        vi.advanceTimersByTime(100);
      });

      let state = result.current[0];
      expect(state.variant).toBe('urlSafe');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeDefined();
      if (stored) {
        const prefs = JSON.parse(stored);
        expect(prefs.variant).toBe('urlSafe');
      }
    });
  });

  describe('setDirection', () => {
    it('switches between encode and decode', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      let state = result.current[0];
      expect(state.direction).toBe('encode');

      act(() => {
        actions.setDirection('decode');
      });

      state = result.current[0];
      expect(state.direction).toBe('decode');
    });
  });

  describe('isValidInput', () => {
    it('returns false for empty text input', () => {
      const { result } = renderHook(() => useBase64());
      let state = result.current[0];
      expect(state.isValidInput).toBe(false);
    });

    it('returns true for non-empty plaintext in encode mode', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setInputText('hello');
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(true);
    });

    it('returns true for valid Base64 in decode mode', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setDirection('decode');
        actions.setInputText('aGVsbG8gd29ybGQ=');
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(true);
    });

    it('returns false for invalid Base64 in decode mode', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setDirection('decode');
        actions.setInputText('ABC!@#');
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(false);
    });

    it('returns false for file exceeding size limit', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.bin');

      act(() => {
        actions.setMode('file');
        actions.setInputFile(largeFile);
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(false);
    });

    it('returns true for file within size limit', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      const validFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

      act(() => {
        actions.setMode('file');
        actions.setInputFile(validFile);
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(true);
    });
  });

  describe('setInputText', () => {
    it('updates input text immediately', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setInputText('hello');
      });

      let state = result.current[0];
      expect(state.inputText).toBe('hello');
    });

    it('clears error when input changes', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setDirection('decode');
        actions.setInputText('invalid!!!');
      });

      let state = result.current[0];
      expect(state.error).toBeNull();
    });
  });

  describe('process', () => {
    it('encodes plaintext to Base64', async () => {
      const { result } = renderHook(() => useBase64());

      act(() => {
        result.current[1].setInputText('hello');
      });

      let [, actions] = result.current;
      await act(async () => {
        await actions.process();
      });

      let state = result.current[0];
      expect(state.outputText).toBe('aGVsbG8=');
      expect(state.error).toBeNull();
    });

    it('decodes valid Base64 to plaintext', async () => {
      const { result } = renderHook(() => useBase64());

      act(() => {
        result.current[1].setDirection('decode');
        result.current[1].setInputText('aGVsbG8gd29ybGQ=');
      });

      let [, actions] = result.current;
      await act(async () => {
        await actions.process();
      });

      let state = result.current[0];
      expect(state.outputText).toBe('hello world');
      expect(state.error).toBeNull();
    });

    it('returns error for invalid Base64 in decode mode', async () => {
      const { result } = renderHook(() => useBase64());

      act(() => {
        result.current[1].setDirection('decode');
        result.current[1].setInputText('ABC!@#');
      });

      let [, actions] = result.current;
      await act(async () => {
        await actions.process();
      });

      let state = result.current[0];
      expect(state.error).not.toBeNull();
      expect(state.error?.code).toBe('invalidBase64');
      expect(state.outputText).toBe('');
    });

    it('handles UTF-8 round-trip correctly', async () => {
      const { result } = renderHook(() => useBase64());
      const testString = 'Hello, 안녕하세요! 😀';

      act(() => {
        result.current[1].setInputText(testString);
      });

      let [, actions] = result.current;
      await act(async () => {
        await actions.process();
      });

      let state = result.current[0];
      const encoded = state.outputText;
      expect(encoded).toBeTruthy();

      act(() => {
        result.current[1].setDirection('decode');
        result.current[1].setInputText(encoded);
      });

      [, actions] = result.current;
      await act(async () => {
        await actions.process();
      });

      state = result.current[0];
      expect(state.outputText).toBe(testString);
    });
  });

  describe('copy', () => {
    it('copies Base64 to clipboard on success', async () => {
      const mockClipboard = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockClipboard },
      } as any);

      try {
        const { result } = renderHook(() => useBase64());

        act(() => {
          result.current[1].setInputText('hello');
        });

        let [, actions] = result.current;
        await act(async () => {
          await actions.process();
        });

        [, actions] = result.current;
        let success = false;
        await act(async () => {
          success = await actions.copy('base64');
        });

        expect(success).toBe(true);
        expect(mockClipboard).toHaveBeenCalledWith('aGVsbG8=');
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('returns false on clipboard failure', async () => {
      const mockClipboard = vi
        .fn()
        .mockRejectedValue(new Error('Clipboard denied'));
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockClipboard },
      } as any);

      try {
        const { result } = renderHook(() => useBase64());

        act(() => {
          result.current[1].setInputText('hello');
        });

        let [, actions] = result.current;
        await act(async () => {
          await actions.process();
        });

        [, actions] = result.current;
        let success = false;
        await act(async () => {
          success = await actions.copy('base64');
        });

        expect(success).toBe(false);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('copies Data-URI for encoded text', async () => {
      const mockClipboard = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockClipboard },
      } as any);

      try {
        const { result } = renderHook(() => useBase64());

        act(() => {
          result.current[1].setInputText('hello');
        });

        let [, actions] = result.current;
        await act(async () => {
          await actions.process();
        });

        [, actions] = result.current;
        let success = false;
        await act(async () => {
          success = await actions.copy('dataUri');
        });

        expect(success).toBe(true);
        expect(mockClipboard).toHaveBeenCalledWith('data:text/plain;base64,aGVsbG8=');
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('does not copy in decode mode for base64 target', async () => {
      const mockClipboard = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        clipboard: { writeText: mockClipboard },
      } as any);

      try {
        const { result } = renderHook(() => useBase64());
        const [, actions] = result.current;

        act(() => {
          actions.setDirection('decode');
          actions.setInputText('aGVsbG8=');
        });

        await act(async () => {
          await actions.process();
        });

        let success = false;
        await act(async () => {
          success = await actions.copy('base64');
        });

        expect(success).toBe(false);
        expect(mockClipboard).not.toHaveBeenCalled();
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('download', () => {
    it('does nothing if output is empty', () => {
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      act(() => {
        actions.setMode('file');
        actions.setInputFile(mockFile);
      });

      act(() => {
        actions.download();
      });

      // No crash is success
    });
  });

  describe('localStorage persistence edge cases', () => {
    it('handles localStorage quota exceeded gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });

      try {
        const { result } = renderHook(() => useBase64());
        const [, actions] = result.current;

        act(() => {
          actions.setMode('file');
        });

        let state = result.current[0];
        expect(state.mode).toBe('file');
      } finally {
        Storage.prototype.setItem = originalSetItem;
      }
    });
  });
});
