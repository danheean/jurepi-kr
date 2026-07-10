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

    it('returns true for a data: URL in decode mode (regression)', () => {
      // The gate previously rejected the data: prefix, so a pasted data URI
      // (what "Copy Data-URI" produces) never reached the decoder.
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setDirection('decode');
        actions.setInputText('data:text/plain;base64,aGVsbG8=');
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(true);
    });

    it('returns true for mismatched-variant Base64 in decode mode', () => {
      // URL-safe payload while the UI is set to standard — decodeSmart accepts
      // both, so the gate must too.
      const { result } = renderHook(() => useBase64());
      const [, actions] = result.current;

      act(() => {
        actions.setDirection('decode');
        actions.setVariant('standard');
        actions.setInputText('SGVsbG8gV29ybGQ');
      });

      let state = result.current[0];
      expect(state.isValidInput).toBe(true);
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

    it('copies a data URI with the real MIME type for an encoded image (regression)', async () => {
      // Bug: "Copy Data-URI" hardcoded `data:text/plain;base64,…` for every
      // mode, so an encoded image produced an invalid text/plain data URI.
      // Async file reading (encodeFile → file.arrayBuffer) needs real timers.
      vi.useRealTimers();
      const mockClipboard = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText: mockClipboard } } as any);

      try {
        const { result } = renderHook(() => useBase64());
        const pngFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'photo.png', {
          type: 'image/png',
        });

        act(() => {
          result.current[1].setMode('file');
          result.current[1].setInputFile(pngFile);
        });
        await act(async () => {
          await result.current[1].process();
        });

        let success = false;
        await act(async () => {
          success = await result.current[1].copy('dataUri');
        });

        expect(success).toBe(true);
        const copied = mockClipboard.mock.calls[0][0] as string;
        expect(copied.startsWith('data:image/png;base64,')).toBe(true);
        expect(copied.startsWith('data:text/plain')).toBe(false);
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

  describe('decoded image handling', () => {
    // 1x1 transparent PNG.
    const PNG_1x1 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    async function decodeInput(input: string) {
      const { result } = renderHook(() => useBase64());
      act(() => {
        result.current[1].setDirection('decode');
        result.current[1].setInputText(input);
      });
      await act(async () => {
        await result.current[1].process();
      });
      return result;
    }

    it('sets decodedImage when decoding image Base64', async () => {
      const result = await decodeInput(PNG_1x1);
      const state = result.current[0];

      expect(state.decodedImage).not.toBeNull();
      expect(state.decodedImage?.mimeType).toBe('image/png');
      expect(state.decodedImage?.dataUri.startsWith('data:image/png;base64,')).toBe(true);
      expect(state.decodedImage?.sizeBytes).toBeGreaterThan(0);
      expect(state.outputText).toBe('');
      expect(state.error).toBeNull();
    });

    it('sets decodedImage when decoding an image data: URL (regression)', async () => {
      // encode → "Copy Data-URI" → decode round-trip: the pasted value carries
      // a data:image/png prefix. Previously the gate dropped it and no image
      // ever rendered.
      const result = await decodeInput(`data:image/png;base64,${PNG_1x1}`);
      const state = result.current[0];

      expect(state.decodedImage).not.toBeNull();
      expect(state.decodedImage?.mimeType).toBe('image/png');
      expect(state.outputText).toBe('');
      expect(state.error).toBeNull();
    });

    it('clears decodedImage when the next decode is plain text', async () => {
      const result = await decodeInput(PNG_1x1);
      expect(result.current[0].decodedImage).not.toBeNull();

      act(() => {
        result.current[1].setInputText('aGVsbG8=');
      });
      await act(async () => {
        await result.current[1].process();
      });

      const state = result.current[0];
      expect(state.decodedImage).toBeNull();
      expect(state.outputText).toBe('hello');
    });

    it('downloadImage triggers a download anchor for the image', async () => {
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});
      try {
        const result = await decodeInput(PNG_1x1);
        act(() => {
          result.current[1].downloadImage();
        });
        expect(clickSpy).toHaveBeenCalled();
      } finally {
        clickSpy.mockRestore();
      }
    });

    it('copyImage returns false when clipboard image write is unavailable', async () => {
      const result = await decodeInput(PNG_1x1);
      let ok = true;
      await act(async () => {
        ok = await result.current[1].copyImage();
      });
      expect(ok).toBe(false);
    });

    it('copyImage writes the image to the clipboard when supported', async () => {
      const write = vi.fn().mockResolvedValue(undefined);
      class FakeClipboardItem {
        constructor(public readonly items: Record<string, Blob>) {}
      }
      vi.stubGlobal('ClipboardItem', FakeClipboardItem as unknown as typeof ClipboardItem);
      vi.stubGlobal('navigator', { clipboard: { write } } as unknown as Navigator);
      try {
        const result = await decodeInput(PNG_1x1);
        let ok = false;
        await act(async () => {
          ok = await result.current[1].copyImage();
        });
        expect(ok).toBe(true);
        expect(write).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('decoded file handling', () => {
    // "JVBERi0xLjQK" = "%PDF-1.4\n"; declared MIME application/pdf → file.
    const PDF_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjQK';

    async function decodeInput(input: string) {
      const { result } = renderHook(() => useBase64());
      act(() => {
        result.current[1].setDirection('decode');
        result.current[1].setInputText(input);
      });
      await act(async () => {
        await result.current[1].process();
      });
      return result;
    }

    it('sets decodedFile for a declared binary data URL', async () => {
      const result = await decodeInput(PDF_DATA_URL);
      const state = result.current[0];

      expect(state.decodedFile).not.toBeNull();
      expect(state.decodedFile?.mimeType).toBe('application/pdf');
      expect(state.decodedFile?.sizeBytes).toBeGreaterThan(0);
      expect(state.outputText).toBe('');
      expect(state.decodedImage).toBeNull();
      expect(state.error).toBeNull();
    });

    it('downloadDecodedFile triggers a download anchor', async () => {
      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});
      try {
        const result = await decodeInput(PDF_DATA_URL);
        act(() => {
          result.current[1].downloadDecodedFile();
        });
        expect(clickSpy).toHaveBeenCalled();
      } finally {
        clickSpy.mockRestore();
      }
    });

    it('clears decodedFile when the next decode is plain text', async () => {
      const result = await decodeInput(PDF_DATA_URL);
      expect(result.current[0].decodedFile).not.toBeNull();

      act(() => {
        result.current[1].setInputText('aGVsbG8=');
      });
      await act(async () => {
        await result.current[1].process();
      });

      expect(result.current[0].decodedFile).toBeNull();
      expect(result.current[0].outputText).toBe('hello');
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
