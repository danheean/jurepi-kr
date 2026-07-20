import { renderHook, act, waitFor } from '@testing-library/react';
import { useLottoGenerator } from './useLottoGenerator';
import { STORAGE_KEY } from '@/lib/lotto-generator/schema';
import type { HistoryEntry } from '@/lib/lotto-generator/schema';

describe('useLottoGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useLottoGenerator());

    expect(result.current.gameCount).toBe(1);
    expect(result.current.fixedNumbers).toEqual([]);
    expect(result.current.excludedNumbers).toEqual([]);
    expect(result.current.games).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.soundOn).toBe(true);
    expect(result.current.animationState.phase).toBe('idle');
  });

  it('loads settings from localStorage on mount', async () => {
    const store = {
      version: 1,
      history: [],
      lastSettings: {
        gameCount: 5,
        fixedNumbers: [7, 13],
        excludedNumbers: [1, 2, 3],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    const { result } = renderHook(() => useLottoGenerator());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    expect(result.current.gameCount).toBe(5);
    expect(result.current.fixedNumbers).toEqual([7, 13]);
    expect(result.current.excludedNumbers).toEqual([1, 2, 3]);
  });

  it('persists settings immediately on change', async () => {
    const { result } = renderHook(() => useLottoGenerator());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setGameCount(3);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(stored.lastSettings.gameCount).toBe(3);
  });

  it('clamps gameCount to min/max', () => {
    const { result } = renderHook(() => useLottoGenerator());

    act(() => {
      result.current.setGameCount(15);
    });

    expect(result.current.gameCount).toBe(10);

    act(() => {
      result.current.setGameCount(-1);
    });

    expect(result.current.gameCount).toBe(1);
  });

  it('adds fixed numbers (max 5)', () => {
    const { result } = renderHook(() => useLottoGenerator());

    act(() => {
      result.current.addFixedNumber(7);
      result.current.addFixedNumber(13);
      result.current.addFixedNumber(42);
    });

    expect(result.current.fixedNumbers).toEqual([7, 13, 42]);

    // Adding duplicate should not add again
    act(() => {
      result.current.addFixedNumber(7);
    });

    expect(result.current.fixedNumbers).toEqual([7, 13, 42]);

    // Adding beyond max should not add
    act(() => {
      result.current.addFixedNumber(1);
      result.current.addFixedNumber(2);
      result.current.addFixedNumber(3);
    });

    expect(result.current.fixedNumbers.length).toBe(5);
  });

  it('removes fixed numbers', () => {
    const { result } = renderHook(() => useLottoGenerator());

    act(() => {
      result.current.addFixedNumber(7);
      result.current.addFixedNumber(13);
    });

    act(() => {
      result.current.removeFixedNumber(7);
    });

    expect(result.current.fixedNumbers).toEqual([13]);
  });

  it('adds excluded numbers (max 39)', () => {
    const { result } = renderHook(() => useLottoGenerator());

    for (let i = 1; i <= 39; i++) {
      act(() => {
        result.current.addExcludedNumber(i);
      });
    }

    expect(result.current.excludedNumbers.length).toBe(39);

    // Adding beyond max should not add
    act(() => {
      result.current.addExcludedNumber(40);
    });

    expect(result.current.excludedNumbers.length).toBe(39);
  });

  it('removes excluded numbers', () => {
    const { result } = renderHook(() => useLottoGenerator());

    act(() => {
      result.current.addExcludedNumber(1);
      result.current.addExcludedNumber(2);
    });

    act(() => {
      result.current.removeExcludedNumber(1);
    });

    expect(result.current.excludedNumbers).toEqual([2]);
  });

  it('generates games and transitions through animation phases', () => {
    // Fake timers only; the mount effect is synchronous (not timer-based),
    // so renderHook's act() flushes it — no waitFor (which deadlocks under fake timers).
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useLottoGenerator({ rollMs: 100, lockMs: 50, staggerMs: 20 })
    );
    expect(result.current.mounted).toBe(true);

    act(() => {
      result.current.setGameCount(2);
    });
    act(() => {
      result.current.generate();
    });

    // Rolling phase immediately after generate
    expect(result.current.animationState.phase).toBe('rolling');
    expect(result.current.games.length).toBe(2);
    expect(result.current.games[0].length).toBe(6);

    // lockStart = (6-1)*staggerMs + rollMs = 5*20 + 100 = 200ms → locking
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.animationState.phase).toBe('locking');

    // 6 balls * (lockMs+staggerMs = 70) = 420ms after locking → done. Advance past it.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.animationState.phase).toBe('done');
  });

  it('adds generated games to history', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useLottoGenerator({ rollMs: 100, lockMs: 50, staggerMs: 20 })
    );
    expect(result.current.mounted).toBe(true);

    act(() => {
      result.current.setGameCount(2);
    });
    act(() => {
      result.current.generate();
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].gameCount).toBe(2);
    expect(result.current.history[0].games.length).toBe(2);
  });

  it('clears history', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useLottoGenerator({ rollMs: 100, lockMs: 50, staggerMs: 20 })
    );
    expect(result.current.mounted).toBe(true);

    act(() => {
      result.current.generate();
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.history.length).toBe(1);

    act(() => {
      result.current.clearHistoryLocal();
    });
    expect(result.current.history.length).toBe(0);
  });

  it('restores from history entry', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useLottoGenerator({ rollMs: 100, lockMs: 50, staggerMs: 20 })
    );
    expect(result.current.mounted).toBe(true);

    act(() => {
      result.current.setGameCount(3);
      result.current.addFixedNumber(7);
    });
    act(() => {
      result.current.generate();
    });
    act(() => {
      vi.runAllTimers();
    });

    const entry = result.current.history[0];

    act(() => {
      result.current.setGameCount(1);
      result.current.removeFixedNumber(7);
    });
    act(() => {
      result.current.restoreFromHistory(entry);
    });

    expect(result.current.gameCount).toBe(3);
    expect(result.current.fixedNumbers).toEqual([7]);
    expect(result.current.games).toEqual(entry.games);
    expect(result.current.animationState.phase).toBe('done');
  });

  it('respects sound toggle', () => {
    const { result } = renderHook(() => useLottoGenerator());

    expect(result.current.soundOn).toBe(true);

    act(() => {
      result.current.setSoundOn(false);
    });

    expect(result.current.soundOn).toBe(false);
  });

  it('ignores invalid fixed/excluded numbers', () => {
    const { result } = renderHook(() => useLottoGenerator());

    act(() => {
      result.current.addFixedNumber(0); // Invalid
      result.current.addFixedNumber(46); // Invalid
      result.current.addExcludedNumber(0); // Invalid
      result.current.addExcludedNumber(46); // Invalid
    });

    expect(result.current.fixedNumbers.length).toBe(0);
    expect(result.current.excludedNumbers.length).toBe(0);
  });
});
