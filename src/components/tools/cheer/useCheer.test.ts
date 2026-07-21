import { renderHook, act } from '@testing-library/react';
import { useCheer } from './useCheer';
import { DEFAULT_SETTINGS } from '@/lib/cheer';

describe('useCheer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('initializes with default settings', () => {
    const { result } = renderHook(() => useCheer());

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.recents).toEqual([]);
  });

  it('opens and closes the immersive presentation overlay', async () => {
    const { result } = renderHook(() => useCheer());

    expect(result.current.presenting).toBe(false);

    act(() => {
      result.current.startPresenting();
    });
    expect(result.current.presenting).toBe(true);

    await act(async () => {
      await result.current.stopPresenting();
    });
    expect(result.current.presenting).toBe(false);
  });

  it('updates settings immutably and persists', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '우리 팀 우승!' });
    });

    expect(result.current.settings.text).toBe('우리 팀 우승!');
    expect(result.current.settings.effect).toBe('scroll'); // default unchanged

    // Check localStorage was persisted
    const stored = localStorage.getItem('jurepi-cheer');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.lastSettings.text).toBe('우리 팀 우승!');
  });

  it('loads and restores from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem(
      'jurepi-cheer',
      JSON.stringify({
        version: 1,
        recents: ['최근 응원'],
        lastSettings: {
          text: '저장된 응원',
          textColor: 'coral',
          bgColor: 'black',
          effect: 'flash',
          speed: 'fast',
          size: 'XL',
          landscape: true,
        },
      })
    );

    const { result } = renderHook(() => useCheer());

    expect(result.current.settings.text).toBe('저장된 응원');
    expect(result.current.settings.textColor).toBe('coral');
    expect(result.current.recents).toContain('최근 응원');
  });

  it('fills in sizeMode/deviceType defaults when loading a legacy v1 blob that predates those fields', () => {
    // Pre-populate localStorage with a pre-auto-size blob — no sizeMode/deviceType.
    localStorage.setItem(
      'jurepi-cheer',
      JSON.stringify({
        version: 1,
        recents: [],
        lastSettings: {
          text: '저장된 응원',
          textColor: 'coral',
          bgColor: 'black',
          effect: 'flash',
          speed: 'fast',
          size: 'XL',
        },
      })
    );

    const { result } = renderHook(() => useCheer());

    // Existing preferences survive; new fields fall back to safe defaults (no data loss).
    expect(result.current.settings.size).toBe('XL');
    expect(result.current.settings.sizeMode).toBe('manual');
    expect(result.current.settings.deviceType).toBe('mobile');
  });

  it('writes STORE_VERSION (2) to localStorage on updateSettings', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '응원' });
    });

    const stored = JSON.parse(localStorage.getItem('jurepi-cheer')!);
    expect(stored.version).toBe(2);
  });

  describe('effectiveSettings (auto font-size)', () => {
    it('mirrors settings.size unchanged when sizeMode is "manual"', () => {
      const { result } = renderHook(() => useCheer());

      act(() => {
        result.current.updateSettings({ size: 'S', sizeMode: 'manual' });
      });

      expect(result.current.effectiveSettings.size).toBe('S');
    });

    it('overrides size with the auto-computed bucket when sizeMode is "auto"', () => {
      const { result } = renderHook(() => useCheer());

      act(() => {
        result.current.updateSettings({
          size: 'S', // stale manual value — auto mode should ignore it
          sizeMode: 'auto',
          deviceType: 'mobile',
          text: 'go go go!!', // 10 chars → XL on mobile
        });
      });

      expect(result.current.effectiveSettings.size).toBe('XL');
      // The raw settings still remember the last manual pick.
      expect(result.current.settings.size).toBe('S');
    });

    it('recomputes effectiveSettings.size as text changes in auto mode', () => {
      const { result } = renderHook(() => useCheer());

      act(() => {
        result.current.updateSettings({ sizeMode: 'auto', deviceType: 'tablet', text: 'a'.repeat(6) });
      });
      expect(result.current.effectiveSettings.size).toBe('XL');

      act(() => {
        result.current.updateSettings({ text: 'a'.repeat(7) });
      });
      expect(result.current.effectiveSettings.size).toBe('L');
    });
  });

  it('commits message to recents', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '첫 번째 응원' });
      result.current.commitMessage('첫 번째 응원');
    });

    expect(result.current.recents).toContain('첫 번째 응원');

    act(() => {
      result.current.updateSettings({ text: '두 번째 응원' });
      result.current.commitMessage('두 번째 응원');
    });

    expect(result.current.recents[0]).toBe('두 번째 응원'); // MRU
    expect(result.current.recents[1]).toBe('첫 번째 응원');
  });

  it('loads a recent message', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '응원' });
      result.current.commitMessage('응원');
    });

    act(() => {
      result.current.updateSettings({ text: '' });
    });

    expect(result.current.settings.text).toBe('');

    act(() => {
      result.current.loadRecent('응원');
    });

    expect(result.current.settings.text).toBe('응원');
  });

  it('clears the message', () => {
    const { result } = renderHook(() => useCheer());

    act(() => {
      result.current.updateSettings({ text: '응원 문구' });
    });

    expect(result.current.settings.text).toBe('응원 문구');

    act(() => {
      result.current.clearMessage();
    });

    expect(result.current.settings.text).toBe('');
  });

  it('supports fullscreen feature detection', () => {
    const { result } = renderHook(() => useCheer());

    // Fullscreen API may or may not be available in test environment
    expect(typeof result.current.isFullscreenSupported).toBe('boolean');
    expect(typeof result.current.isFullscreenActive).toBe('boolean');
  });

  it('supports wake lock feature detection', () => {
    const { result } = renderHook(() => useCheer());

    expect(typeof result.current.isWakeLockSupported).toBe('boolean');
    expect(typeof result.current.isWakeLocked).toBe('boolean');
  });
});
