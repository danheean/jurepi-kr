import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransparencyRemover } from '../useTransparencyRemover';
import { STORE_KEY } from '@/lib/transparent-background';

describe('useTransparencyRemover', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useTransparencyRemover());

    expect(result.current.tolerance).toBe(50);
    expect(result.current.feather).toBe(2);
    expect(result.current.mode).toBe('flood-fill');
    expect(result.current.phase).toBe('idle');
    expect(result.current.bgColor).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('persists options to localStorage', async () => {
    const { result } = renderHook(() => useTransparencyRemover());

    act(() => {
      result.current.updateOptions({ tolerance: 75 });
    });

    // Wait for debounce
    await act(() => new Promise((resolve) => setTimeout(resolve, 600)));

    const stored = localStorage.getItem(STORE_KEY);
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.tolerance).toBe(75);
  });

  it('recovers options from localStorage on mount', async () => {
    // Set initial value
    localStorage.setItem(STORE_KEY, JSON.stringify({
      tolerance: 65,
      feather: 5,
      mode: 'global',
    }));

    const { result } = renderHook(() => useTransparencyRemover());

    // Wait for effect
    await waitFor(() => {
      expect(result.current.tolerance).toBe(65);
    });
  });

  it('resets state to initial values', () => {
    const { result } = renderHook(() => useTransparencyRemover());

    act(() => {
      result.current.updateOptions({ tolerance: 80 });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.phase).toBe('idle');
    expect(result.current.sourceFile).toBeNull();
    expect(result.current.sourceImage).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('exportPNG returns null when resultCanvas is null', async () => {
    const { result } = renderHook(() => useTransparencyRemover());
    const blob = await result.current.exportPNG();
    expect(blob).toBeNull();
  });

  it('copyToClipboard resolves false (not a silent no-op) when resultCanvas is null', async () => {
    const { result } = renderHook(() => useTransparencyRemover());
    await expect(result.current.copyToClipboard()).resolves.toBe(false);
  });
});
