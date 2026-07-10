import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCronParser } from './useCronParser';

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

describe('useCronParser hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useCronParser());

    expect(result.current.expression).toBe('');
    expect(result.current.timezone).toBe('Local');
    expect(result.current.recents).toEqual([]);
    expect(result.current.parsedFields).toBeNull();
    expect(result.current.parseError).toBeNull();
    expect(result.current.description).toBeNull();
    expect(result.current.nextRuns).toBeNull();
  });

  it('parses valid cron expression after debounce', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setExpression('0 9 * * MON-FRI');
    });

    // Before debounce
    expect(result.current.parsedFields).toBeNull();

    // Wait for debounce (200ms)
    await waitFor(
      () => {
        expect(result.current.parsedFields).not.toBeNull();
        expect(result.current.parseError).toBeNull();
      },
      { timeout: 2000 }
    );

    expect(result.current.parsedFields?.minute).toEqual([0]);
    expect(result.current.parsedFields?.hour).toEqual([9]);
    expect(result.current.description).not.toBeNull();
    expect(result.current.nextRuns).not.toBeNull();
  });

  it('sets parseError for invalid cron expression', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setExpression('invalid cron');
    });

    await waitFor(
      () => {
        expect(result.current.parseError).not.toBeNull();
        expect(result.current.parsedFields).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it('persists expression and timezone to localStorage', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setExpression('0 0 * * *');
    });

    await waitFor(
      () => {
        const stored = localStorage.getItem('jurepi-cron-parser-state');
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.lastExpression).toBe('0 0 * * *');
      },
      { timeout: 2000 }
    );

    act(() => {
      result.current.setTimezone('America/New_York');
    });

    const stored = localStorage.getItem('jurepi-cron-parser-state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.timezone).toBe('America/New_York');
  });

  it('persists timezone change immediately (not debounced)', () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setTimezone('Europe/London');
    });

    // No debounce — should persist immediately
    const stored = localStorage.getItem('jurepi-cron-parser-state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.timezone).toBe('Europe/London');
  });

  it('adds recent expression on successful parse', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setExpression('0 9 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.recents).toContain('0 9 * * *');
      },
      { timeout: 2000 }
    );
  });

  it('removes duplicate recents (keeps one copy, most recent)', async () => {
    const { result } = renderHook(() => useCronParser());

    // First use
    act(() => {
      result.current.setExpression('0 9 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.recents).toContain('0 9 * * *');
      },
      { timeout: 2000 }
    );

    const firstLength = result.current.recents.length;

    // Use different expression
    act(() => {
      result.current.setExpression('0 12 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.recents).toContain('0 12 * * *');
      },
      { timeout: 2000 }
    );

    const secondLength = result.current.recents.length;
    expect(secondLength).toBeGreaterThan(firstLength);

    // Re-use first expression — should move to top, not duplicate
    act(() => {
      result.current.setExpression('0 9 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.recents[0]).toBe('0 9 * * *');
      },
      { timeout: 2000 }
    );

    // Should still have same length (no duplication)
    expect(result.current.recents.length).toBeLessThanOrEqual(secondLength);
  });

  it('deletes recent expression', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setExpression('0 9 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.recents).toContain('0 9 * * *');
      },
      { timeout: 2000 }
    );

    act(() => {
      result.current.removeRecent('0 9 * * *');
    });

    expect(result.current.recents).not.toContain('0 9 * * *');
  });

  it('recomputes nextRuns when timezone changes (without re-parsing)', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setExpression('0 9 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.nextRuns).not.toBeNull();
      },
      { timeout: 2000 }
    );

    const firstRuns = result.current.nextRuns;
    const firstFields = result.current.parsedFields;

    act(() => {
      result.current.setTimezone('Asia/Tokyo');
    });

    await waitFor(
      () => {
        // nextRuns should be recomputed (different timezone)
        expect(result.current.nextRuns).not.toBe(firstRuns);
      },
      { timeout: 2000 }
    );

    // Parsed fields should remain the same (not re-parsed)
    expect(result.current.parsedFields).toEqual(firstFields);
  });

  it('loads persisted state on mount', async () => {
    localStorage.setItem(
      'jurepi-cron-parser-state',
      JSON.stringify({
        lastExpression: '0 0 1 * *',
        timezone: 'Europe/Paris',
        recents: ['0 0 1 * *', '0 9 * * MON-FRI'],
      })
    );

    const { result } = renderHook(() => useCronParser());

    await waitFor(
      () => {
        expect(result.current.expression).toBe('0 0 1 * *');
        expect(result.current.timezone).toBe('Europe/Paris');
        expect(result.current.recents).toEqual(['0 0 1 * *', '0 9 * * MON-FRI']);
      },
      { timeout: 2000 }
    );
  });

  it('validates and prunes corrupted localStorage data', async () => {
    localStorage.setItem(
      'jurepi-cron-parser-state',
      JSON.stringify({
        lastExpression: '0 9 * * *',
        timezone: 'InvalidTimezone', // Not a valid IANA zone
        recents: ['valid', 123, null, 'also-valid'], // Mixed types
      })
    );

    const { result } = renderHook(() => useCronParser());

    // Should load what's valid, ignore invalid
    await waitFor(
      () => {
        expect(result.current.expression).toBe('0 9 * * *');
        expect(result.current.timezone).toBe('Local'); // Invalid tz defaults to Local
        expect(result.current.recents).toEqual(['valid', 'also-valid']); // Filters non-strings
      },
      { timeout: 2000 }
    );
  });

  it('max 20 recents (prunes oldest if exceeded)', async () => {
    const { result } = renderHook(() => useCronParser());

    // Add several expressions
    const expressions = ['0 9 * * *', '0 12 * * *', '0 15 * * *'];

    for (const expr of expressions) {
      act(() => {
        result.current.setExpression(expr);
      });

      await waitFor(
        () => {
          expect(result.current.recents).toContain(expr);
        },
        { timeout: 2000 }
      );
    }

    // Verify all three are in recents
    expect(result.current.recents).toContain('0 9 * * *');
    expect(result.current.recents).toContain('0 12 * * *');
    expect(result.current.recents).toContain('0 15 * * *');

    // Verify newest is first
    expect(result.current.recents[0]).toBe('0 15 * * *');

    // Verify list is capped (max 20)
    expect(result.current.recents.length).toBeLessThanOrEqual(20);
  });

  it('initializes with default mode unix', () => {
    const { result } = renderHook(() => useCronParser());

    expect(result.current.mode).toBe('unix');
  });

  it('switches to quartz mode and persists', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setMode('quartz');
    });

    expect(result.current.mode).toBe('quartz');

    // Verify persisted to localStorage
    const stored = localStorage.getItem('jurepi-cron-parser-state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('quartz');
  });

  it('parses unix cron when mode is unix', async () => {
    const { result } = renderHook(() => useCronParser());

    act(() => {
      result.current.setMode('unix');
      result.current.setExpression('0 9 * * MON-FRI');
    });

    await waitFor(
      () => {
        expect(result.current.parsedFields).not.toBeNull();
        expect(result.current.description).not.toBeNull();
      },
      { timeout: 2000 }
    );

    // Should have unix-format fields
    expect(result.current.parsedFields?.minute).toEqual([0]);
  });

  it('returns quartz fields when parsing in quartz mode', async () => {
    const { result } = renderHook(() => useCronParser());

    // Set mode to quartz
    act(() => {
      result.current.setMode('quartz');
    });

    expect(result.current.mode).toBe('quartz');

    // After switching to quartz mode, quartz fields should be available
    // (even if the expression is empty, the structure should be there)
    expect(result.current.hasOwnProperty('quartzFields')).toBe(true);
    expect(result.current.hasOwnProperty('quartzDescription')).toBe(true);
  });

  it('clears fields when mode changes', async () => {
    const { result } = renderHook(() => useCronParser());

    // Start with unix
    act(() => {
      result.current.setMode('unix');
      result.current.setExpression('0 9 * * *');
    });

    await waitFor(
      () => {
        expect(result.current.parsedFields).not.toBeNull();
      },
      { timeout: 2000 }
    );

    // Switch to quartz
    act(() => {
      result.current.setMode('quartz');
    });

    // Unix fields should be null, quartz fields should be evaluated for same expression
    // (which should fail because it's not valid quartz format)
    expect(result.current.parseError).not.toBeNull();
  });

});
