import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterCounter } from './useCharacterCounter';

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

describe('useCharacterCounter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useCharacterCounter());

    expect(result.current.text).toBe('');
    expect(result.current.metrics.charactersWithSpaces).toBe(0);
    expect(result.current.limit).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('updates text immediately', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Hello');
    });

    expect(result.current.text).toBe('Hello');
  });

  it('computes metrics after debounce', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Hello');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.charactersWithSpaces).toBe(5);
    expect(result.current.metrics.words).toBe(1);
  });

  it('counts characters correctly', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Hello World');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.charactersWithSpaces).toBe(11);
    expect(result.current.metrics.charactersWithoutSpaces).toBe(10);
  });

  it('counts words correctly', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Hello World Test');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.words).toBe(3);
  });

  it('clears text', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Some text');
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current.clearText();
      vi.advanceTimersByTime(300);
    });

    expect(result.current.text).toBe('');
    expect(result.current.metrics.charactersWithSpaces).toBe(0);
  });

  it('handles paragraph counting', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Para 1\n\nPara 2\n\nPara 3');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.paragraphs).toBe(3);
  });

  it('handles line counting', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Line 1\nLine 2\nLine 3');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.lines).toBe(3);
  });

  it('counts sentences correctly', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('One. Two! Three?');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.sentences).toBe(3);
  });

  it('counts bytes (UTF-8) correctly', () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      // Korean character takes 3 bytes in UTF-8
      result.current.setText('한');
      vi.advanceTimersByTime(300);
    });

    expect(result.current.metrics.byteSize).toBe(3);
  });

  it('does not throw on copy failure', async () => {
    const { result } = renderHook(() => useCharacterCounter());

    act(() => {
      result.current.setText('Test');
      vi.advanceTimersByTime(300);
    });

    // Mock clipboard to fail
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: () => Promise.reject(new Error('Clipboard failed')),
      },
      writable: true,
    });

    // Should not throw
    await expect(result.current.copyText()).resolves.toBeUndefined();

    // Restore
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    });
  });
});
