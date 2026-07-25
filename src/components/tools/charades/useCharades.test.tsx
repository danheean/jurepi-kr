import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useCharades } from './useCharades';

// Mock the catalog import
vi.mock('./data/charades.generated.json', () => ({
  default: [
    {
      slug: 'actions-easy-a',
      category: 'actions',
      difficulty: 'easy',
      words: Array.from({ length: 10 }, (_, i) => ({
        term: `Action ${i + 1}`,
        hint: `Hint ${i + 1}`,
      })),
      ko: {
        title: '동작 A팀',
        words: Array.from({ length: 10 }, (_, i) => ({
          term: `동작 ${i + 1}`,
          hint: `힌트 ${i + 1}`,
        })),
      },
      en: {
        title: 'Actions Team A',
        words: Array.from({ length: 10 }, (_, i) => ({
          term: `Action ${i + 1}`,
          hint: `Hint ${i + 1}`,
        })),
      },
    },
  ],
}));

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={{} as any}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('useCharades', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with browse phase', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    expect(result.current.phase).toBe('browse');
  });

  it('should open setup phase when a deck is selected', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.filtered.length).toBeGreaterThan(0);
    const deckSlug = result.current.filtered[0]?.slug;

    act(() => {
      result.current.openSetup(deckSlug!);
    });

    expect(result.current.phase).toBe('setup');
    expect(result.current.selectedDeck?.slug).toBe(deckSlug);
  });

  it('should cancel setup and return to browse', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    const deckSlug = result.current.filtered[0]?.slug;
    act(() => result.current.openSetup(deckSlug!));
    expect(result.current.phase).toBe('setup');

    act(() => result.current.cancelSetup());
    expect(result.current.phase).toBe('browse');
  });

  it('should toggle favorite', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    const deckSlug = result.current.filtered[0]?.slug!;
    expect(result.current.favorites).not.toContain(deckSlug);

    act(() => result.current.toggleFavorite(deckSlug));
    expect(result.current.favorites).toContain(deckSlug);

    act(() => result.current.toggleFavorite(deckSlug));
    expect(result.current.favorites).not.toContain(deckSlug);
  });

  it('should toggle sound', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    const initialSoundState = result.current.soundOn;
    act(() => result.current.toggleSound());
    expect(result.current.soundOn).toBe(!initialSoundState);
  });

  it('should filter by category', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    act(() => result.current.setActiveCategory('actions'));
    expect(result.current.activeCategory).toBe('actions');
  });

  it('should recover from corrupt localStorage', async () => {
    localStorage.setItem('jurepi-charades', 'CORRUPT JSON {invalid}');

    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.phase).toBe('browse');
  });

  it('persists to the charades-specific localStorage key (not shared with speed-quiz)', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    const deckSlug = result.current.filtered[0]?.slug!;
    act(() => result.current.toggleFavorite(deckSlug));

    await waitFor(() => {
      const stored = localStorage.getItem('jurepi-charades');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).favorites).toContain(deckSlug);
    });
    expect(localStorage.getItem('jurepi-speed-quiz')).toBeNull();
  });

  it('transitions to summary after the last word (no overshoot past total)', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    const deckSlug = result.current.filtered[0]!.slug;
    act(() => result.current.openSetup(deckSlug));
    act(() => result.current.startGame());
    expect(result.current.phase).toBe('playing');

    const total = result.current.total;
    for (let i = 0; i < total; i++) {
      act(() => result.current.markCorrect());
    }

    expect(result.current.phase).toBe('summary');
    expect(result.current.score.correct).toBe(total);
    expect(result.current.summaryWords.length).toBe(total);
  });

  it('endGame jumps straight to summary from mid-round', async () => {
    const { result } = renderHook(() => useCharades(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.mounted).toBe(true));

    const deckSlug = result.current.filtered[0]!.slug;
    act(() => result.current.openSetup(deckSlug));
    act(() => result.current.startGame());
    act(() => result.current.markCorrect());
    act(() => result.current.endGame());

    expect(result.current.phase).toBe('summary');
  });
});
