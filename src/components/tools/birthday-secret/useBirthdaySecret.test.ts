import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBirthdaySecret } from './useBirthdaySecret';
import { RECENTS_MAX } from '@/lib/birthday-secret/schema';

const STORAGE_KEY = 'jurepi-birthday-secret';

describe('useBirthdaySecret', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/ko/tools/birthday-secret');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('starts with no selected date and empty recents', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.dateKey).toBeNull());
      expect(result.current.recents).toEqual([]);
      expect(result.current.coupleMode).toBe(false);
    });

    it('restores a valid ?date= from the URL after mount', async () => {
      window.history.replaceState(null, '', '/ko/tools/birthday-secret?date=04-15');
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.dateKey).toBe('04-15'));
    });

    it('ignores an invalid ?date= from the URL', async () => {
      window.history.replaceState(null, '', '/ko/tools/birthday-secret?date=13-40');
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));
      expect(result.current.dateKey).toBeNull();
    });

    it('loads previously saved recents from localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['04-15', '12-25']));
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual(['04-15', '12-25']));
    });

    it('prunes invalid entries from corrupted localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['04-15', 'not-a-date', 42, null]));
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual(['04-15']));
    });

    it('falls back to empty recents on unparsable localStorage', async () => {
      localStorage.setItem(STORAGE_KEY, 'not json');
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));
    });
  });

  describe('selectDate', () => {
    it('sets dateKey and updates the URL for a valid month/day', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));

      expect(result.current.dateKey).toBe('04-15');
      expect(window.location.search).toContain('date=04-15');
    });

    it('ignores an out-of-range day for the given month', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(2, 30));

      expect(result.current.dateKey).toBeNull();
    });

    it('records the selection into recents, most-recent first', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.selectDate(12, 25));

      expect(result.current.recents).toEqual(['12-25', '04-15']);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toEqual(['12-25', '04-15']);
    });

    it('de-duplicates a repeated selection instead of listing it twice', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.selectDate(12, 25));
      act(() => result.current.selectDate(4, 15));

      expect(result.current.recents).toEqual(['04-15', '12-25']);
    });

    it(`caps recents at ${RECENTS_MAX} entries`, async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => {
        for (let m = 1; m <= RECENTS_MAX + 3; m++) result.current.selectDate(1, m);
      });

      expect(result.current.recents).toHaveLength(RECENTS_MAX);
      // Most recent (day = RECENTS_MAX + 3) should be first.
      expect(result.current.recents[0]).toBe(`01-${String(RECENTS_MAX + 3).padStart(2, '0')}`);
    });
  });

  describe('clearDate', () => {
    it('clears the selected date and removes ?date from the URL', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      expect(result.current.dateKey).toBe('04-15');

      act(() => result.current.clearDate());

      expect(result.current.dateKey).toBeNull();
      expect(window.location.search).not.toContain('date=');
    });

    it('does not clear recents', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.clearDate());

      expect(result.current.recents).toEqual(['04-15']);
    });
  });

  describe('clearRecents', () => {
    it('empties the recents list', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.selectDate(12, 25));
      expect(result.current.recents).toHaveLength(2);

      act(() => result.current.clearRecents());

      expect(result.current.recents).toEqual([]);
    });

    it('persists the cleared list to localStorage', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.clearRecents());

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '["sentinel"]');
      expect(stored).toEqual([]);
    });

    it('does not clear the currently selected date', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.clearRecents());

      expect(result.current.dateKey).toBe('04-15');
    });

    it('survives a remount (recents stay cleared)', async () => {
      const { result, unmount } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      act(() => result.current.clearRecents());
      unmount();

      const { result: result2 } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result2.current.recents).toEqual([]));
    });
  });

  describe('coupleMode', () => {
    it('derives coupleView once both my and partner dates are selected', async () => {
      const { result } = renderHook(() => useBirthdaySecret());
      await waitFor(() => expect(result.current.recents).toEqual([]));

      act(() => result.current.selectDate(4, 15));
      expect(result.current.coupleView).toBeNull();

      act(() => result.current.selectPartner(9, 9));
      expect(result.current.partnerKey).toBe('09-09');
    });
  });
});
