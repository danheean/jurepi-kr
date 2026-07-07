import { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFindReplace } from './useFindReplace';
import { APPLY_DEBOUNCE, STORAGE_KEY } from '@/lib/find-replace';
import { AllTheProviders } from '@/__test__/test-utils';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  writable: true,
});

describe('useFindReplace', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('initializes with empty text and one blank rule', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });
    expect(result.current.text).toBe('');
    expect(result.current.rules).toHaveLength(1);
    expect(result.current.rules[0].find).toBe('');
    expect(result.current.rules[0].replace).toBe('');
  });

  it('reads from localStorage on mount', () => {
    const initialState = {
      version: 1,
      rules: [
        { id: 'r1', find: 'hello', replace: 'world', isRegex: false, caseSensitive: false, wholeWord: false, firstOnly: false, enabled: true },
      ],
      savedSets: [],
      recents: ['hello world'],
      meta: { createdAt: Date.now() },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));

    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });
    expect(result.current.rules).toHaveLength(1);
    expect(result.current.rules[0].find).toBe('hello');
    expect(result.current.recents).toContain('hello world');
  });

  it('setText triggers debounced apply', async () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.setText('test text');
    });

    expect(result.current.text).toBe('test text');
    expect(result.current.applyResult.output).toBe('');

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.output).toBe('test text');
    });
  });

  it('addRule appends a new blank rule', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });
    const initialCount = result.current.rules.length;

    act(() => {
      result.current.addRule();
    });

    expect(result.current.rules).toHaveLength(initialCount + 1);
    expect(result.current.rules[initialCount].find).toBe('');
  });

  it('updateRule modifies a rule and triggers apply', async () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.setText('cat dog cat');
      result.current.updateRule(0, { find: 'cat', replace: 'mouse' });
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.totalCount).toBe(2);
      expect(result.current.applyResult.output).toBe('mouse dog mouse');
    });
  });

  it('removeRule deletes a rule and keeps at least one', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.addRule();
    });

    expect(result.current.rules).toHaveLength(2);

    act(() => {
      result.current.removeRule(0);
    });

    expect(result.current.rules).toHaveLength(1);

    // Cannot remove last rule
    act(() => {
      result.current.removeRule(0);
    });

    expect(result.current.rules).toHaveLength(1);
  });

  it('reorderRule changes rule order and triggers apply', async () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.setText('abc def');
      result.current.updateRule(0, { find: 'abc', replace: 'def' });
      result.current.addRule();
      result.current.updateRule(1, { find: 'def', replace: 'xyz' });
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.output).toBe('xyz xyz');
    });

    // Swap order
    act(() => {
      result.current.reorderRule(0, 1);
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.output).toBe('def xyz');
    });
  });

  it('toggleRuleEnabled enables/disables a rule', async () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.setText('abc');
      result.current.updateRule(0, { find: 'abc', replace: 'def' });
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.output).toBe('def');
    });

    // Disable rule
    act(() => {
      result.current.toggleRuleEnabled(0);
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.output).toBe('abc');
    });
  });

  it('duplicateRule creates a copy with new ID', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.updateRule(0, { find: 'a', replace: 'b' });
      result.current.duplicateRule(0);
    });

    expect(result.current.rules).toHaveLength(2);
    expect(result.current.rules[1].find).toBe('a');
    expect(result.current.rules[1].replace).toBe('b');
    expect(result.current.rules[1].id).not.toBe(result.current.rules[0].id);
  });

  it('saveRuleSet persists to savedSets', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.updateRule(0, { find: 'x', replace: 'y' });
      result.current.saveRuleSet('my-rules');
    });

    expect(result.current.savedSets).toHaveLength(1);
    expect(result.current.savedSets[0].name).toBe('my-rules');
    expect(result.current.savedSets[0].rules[0].find).toBe('x');
  });

  it('applyRuleSet loads rules from saved set', async () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.updateRule(0, { find: 'a', replace: 'b' });
      result.current.saveRuleSet('set1');
      result.current.updateRule(0, { find: 'x', replace: 'y' });
      result.current.saveRuleSet('set2');
    });

    expect(result.current.rules[0].find).toBe('x');

    act(() => {
      result.current.applyRuleSet('set1');
    });

    expect(result.current.rules[0].find).toBe('a');
  });

  it('removeRuleSet deletes from savedSets', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.saveRuleSet('set1');
      result.current.saveRuleSet('set2');
    });

    expect(result.current.savedSets).toHaveLength(2);

    act(() => {
      result.current.removeRuleSet('set1');
    });

    expect(result.current.savedSets).toHaveLength(1);
    expect(result.current.savedSets[0].name).toBe('set2');
  });

  it('copyResult calls clipboard.writeText', async () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.setText('hello world');
      result.current.updateRule(0, { find: 'world', replace: 'universe' });
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    await waitFor(() => {
      expect(result.current.applyResult.output).toBe('hello universe');
    });

    await act(async () => {
      await result.current.copyResult();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'hello universe'
    );
  });

  it('downloadResult creates and clicks a blob URL', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.setText('download me');
      result.current.updateRule(0, { find: 'download', replace: 'uploaded' });
    });

    act(() => {
      vi.advanceTimersByTime(APPLY_DEBOUNCE);
    });

    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    act(() => {
      result.current.downloadResult('test.txt');
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });

  it('persists rules and sets to localStorage', () => {
    const { result } = renderHook(() => useFindReplace(), { wrapper: AllTheProviders });

    act(() => {
      result.current.updateRule(0, { find: 'test', replace: 'pass' });
      result.current.saveRuleSet('saved');
    });

    // Trigger persist debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.rules[0].find).toBe('test');
    expect(parsed.savedSets[0].name).toBe('saved');
  });
});
