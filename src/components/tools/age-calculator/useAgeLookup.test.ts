import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAgeLookup } from './useAgeLookup';
import { toDateKey } from '@/lib/age-calculator/date';
import type { RecentEntry } from '@/lib/age-calculator/recents';

const hasDate = (recents: RecentEntry[], date: string) => recents.some((e) => e.date === date);

describe('useAgeLookup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes empty', () => {
    const { result } = renderHook(() => useAgeLookup());
    expect(result.current.birthdate).toBeNull();
    expect(result.current.age).toBeNull();
    expect(result.current.calendarType).toBe('solar');
  });

  it('calculates age for a valid solar birthdate (async resolve)', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('2000-03-15'));
    await waitFor(() => {
      expect(result.current.age).not.toBeNull();
      expect(result.current.age?.manNai).toBeGreaterThanOrEqual(23);
      expect(result.current.error).toBeNull();
    });
  });

  it('computes the accurate lunar-year zodiac for a solar date before the lunar new year', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('2000-01-15')); // before 2000 lunar new year → rabbit
    await waitFor(() => expect(result.current.age?.zodiacKey).toBe('rabbit'));
  });

  it('resolves a lunar birthdate to solar and exposes 간지', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('2000-01-01', 'lunar', false));
    await waitFor(() => {
      expect(result.current.age).not.toBeNull();
      expect(result.current.age?.zodiacKey).toBe('dragon'); // lunar year 2000
      expect(result.current.age?.sexagenary?.hanja).toMatch(/[一-鿿]{2}/);
    });
  });

  it('errors when a leap month does not exist that year', async () => {
    const { result } = renderHook(() => useAgeLookup());
    // 2000 has no leap month at month 5 with isLeap → no-leap
    act(() => result.current.setBirthdate('2001-01-01', 'lunar', true));
    await waitFor(() => {
      expect(result.current.error).toBe('no-leap');
      expect(result.current.age).toBeNull();
    });
  });

  it('rejects a future date within range', async () => {
    const { result } = renderHook(() => useAgeLookup());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    act(() => result.current.setBirthdate(toDateKey(tomorrow)));
    await waitFor(() => expect(result.current.error).toBe('future'));
  });

  it('rejects a year before the supported range (too-old)', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1850-01-01'));
    await waitFor(() => expect(result.current.error).toBe('too-old'));
  });

  it('pushes a settled valid birthdate to recents', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1990-05-10'));
    await waitFor(() => expect(hasDate(result.current.recents, '1990-05-10')).toBe(true));
  });

  it('records lunar entries with their calendar context', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('2000-01-01', 'lunar', false));
    await waitFor(() => {
      const entry = result.current.recents.find((e) => e.date === '2000-01-01');
      expect(entry?.calendarType).toBe('lunar');
    });
  });

  it('deduplicates recents, most-recent-first', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1990-05-10'));
    await waitFor(() => expect(hasDate(result.current.recents, '1990-05-10')).toBe(true));
    act(() => result.current.setBirthdate('1985-01-01'));
    await waitFor(() => {
      expect(result.current.recents[0].date).toBe('1985-01-01');
      expect(result.current.recents[1].date).toBe('1990-05-10');
    });
  });

  it('selects a recent entry and recalculates', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1995-06-15'));
    await waitFor(() => expect(result.current.age).not.toBeNull());
    act(() => result.current.setBirthdate(null));
    expect(result.current.age).toBeNull();
    act(() => result.current.selectRecent({ date: '1995-06-15', calendarType: 'solar', isLeapMonth: false }));
    await waitFor(() => {
      expect(result.current.birthdate).toBe('1995-06-15');
      expect(result.current.age).not.toBeNull();
    });
  });

  it('clears recents', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1990-05-10'));
    await waitFor(() => expect(result.current.recents).toHaveLength(1));
    act(() => result.current.clearRecents());
    expect(result.current.recents).toHaveLength(0);
  });

  it('clears error', async () => {
    const { result } = renderHook(() => useAgeLookup());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    act(() => result.current.setBirthdate(toDateKey(tomorrow)));
    await waitFor(() => expect(result.current.error).toBe('future'));
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('recomputes age against an as-of date', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1990-05-10'));
    await waitFor(() => expect(result.current.age).not.toBeNull());
    act(() => {
      result.current.setUseAsOf(true);
      result.current.setAsOfDate('2020-05-10');
    });
    await waitFor(() => expect(result.current.age?.manNai).toBe(30));
  });

  it('adds and removes people', () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.addPerson('홍길동', '1990-05-10'));
    expect(result.current.people).toHaveLength(1);
    expect(result.current.people[0]).toMatchObject({ name: '홍길동', birthdate: '1990-05-10', calendarType: 'solar' });
    act(() => result.current.removePerson(result.current.people[0].id));
    expect(result.current.people).toHaveLength(0);
  });

  it('stores a lunar person with its calendar context', () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.addPerson('음력이', '1988-04-10', 'lunar', true));
    expect(result.current.people[0]).toMatchObject({ calendarType: 'lunar', isLeapMonth: true });
  });

  it('respects max 20 people', () => {
    const { result } = renderHook(() => useAgeLookup());
    for (let i = 0; i < 25; i++) {
      act(() => result.current.addPerson(`Person${i}`, `${1950 + i}-01-01`));
    }
    expect(result.current.people.length).toBeLessThanOrEqual(20);
  });

  it('copies result to clipboard once age is available', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.setBirthdate('1990-05-10'));
    await waitFor(() => expect(result.current.age).not.toBeNull());
    const ok = await result.current.copyResultToClipboard();
    expect(ok).toBe(true);
  });

  it('returns false on copy when no birthdate', async () => {
    const { result } = renderHook(() => useAgeLookup());
    expect(await result.current.copyResultToClipboard()).toBe(false);
  });

  it('persists people and recents to localStorage', async () => {
    const { result } = renderHook(() => useAgeLookup());
    act(() => result.current.addPerson('홍길동', '1990-05-10'));
    expect(JSON.parse(localStorage.getItem('jurepi-age-calculator-people')!).people).toHaveLength(1);
    act(() => result.current.setBirthdate('1990-05-10'));
    await waitFor(() => {
      const stored = localStorage.getItem('jurepi-age-calculator-recents');
      expect(stored && JSON.parse(stored).length).toBeGreaterThan(0);
    });
  });
});
