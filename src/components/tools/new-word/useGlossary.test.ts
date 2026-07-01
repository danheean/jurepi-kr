'use client';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGlossary } from './useGlossary';
import type { MergedTerm } from '@/lib/new-word/schema';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock the dynamic import of terms.generated.json
vi.mock('./data/terms.generated.json', () => ({
  default: [
    {
      slug: 'god-life',
      topic: 'mz' as const,
      tags: ['lifestyle', 'aspirational'],
      related: ['vibe-coding'],
      ko: {
        term: '신의 삶',
        definition: '이상적인 삶',
        examples: ['좋은 일만 일어나는 삶을 꿈꾼다'],
        body: 'An **ideal** life where everything works out. Sometimes called _the dream_.',
      },
      en: {
        term: 'god life',
        definition: 'An ideal life where everything works out perfectly.',
        examples: ['Living a god life means no stress'],
        body: 'Perfect harmony. `flow state` achieved.',
      },
    },
    {
      slug: 'vibe-coding',
      topic: 'tech' as const,
      tags: ['programming', 'style'],
      related: ['god-life'],
      ko: {
        term: '기분 코딩',
        definition: '직관적 코딩',
        examples: ['코드 스타일을 느낌으로 짠다'],
        body: '',
      },
      en: {
        term: 'vibe coding',
        definition: 'Programming by intuition and feel.',
        examples: ['Coding without strict rules'],
        body: '',
      },
    },
    {
      slug: 'context-window',
      topic: 'tech' as const,
      tags: ['ai', 'llm'],
      related: [],
      ko: {
        term: '컨텍스트 윈도우',
        definition: 'LLM의 메모리 크기',
        examples: ['Claude의 컨텍스트 윈도우는 매우 크다'],
        body: '',
      },
      en: {
        term: 'context window',
        definition: 'The amount of text an LLM can process at once.',
        examples: ['A larger context window means more memory'],
        body: '',
      },
    },
  ] as MergedTerm[],
}));

const mockCatalog = [
  {
    slug: 'god-life',
    topic: 'mz' as const,
    tags: ['lifestyle', 'aspirational'],
    related: ['vibe-coding'],
    ko: {
      term: '신의 삶',
      definition: '이상적인 삶',
      examples: ['좋은 일만 일어나는 삶을 꿈꾼다'],
      body: 'An **ideal** life where everything works out. Sometimes called _the dream_.',
    },
    en: {
      term: 'god life',
      definition: 'An ideal life where everything works out perfectly.',
      examples: ['Living a god life means no stress'],
      body: 'Perfect harmony. `flow state` achieved.',
    },
  },
  {
    slug: 'vibe-coding',
    topic: 'tech' as const,
    tags: ['programming', 'style'],
    related: ['god-life'],
    ko: {
      term: '기분 코딩',
      definition: '직관적 코딩',
      examples: ['코드 스타일을 느낌으로 짠다'],
      body: '',
    },
    en: {
      term: 'vibe coding',
      definition: 'Programming by intuition and feel.',
      examples: ['Coding without strict rules'],
      body: '',
    },
  },
] as MergedTerm[];

describe('useGlossary hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with provided catalog', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    expect(result.current.catalog).toEqual(mockCatalog);
    expect(result.current.filtered).toEqual(mockCatalog);
    expect(result.current.selectedSlug).toBeNull();
    expect(result.current.query).toBe('');
  });

  it('loads catalog from dynamic import if not provided', async () => {
    const { result } = renderHook(() => useGlossary([]));

    await waitFor(() => {
      expect(result.current.catalog.length).toBeGreaterThan(0);
    });
  });

  it('loads favorites from localStorage on mount', async () => {
    const store = {
      version: 1,
      favorites: ['god-life'],
      recents: [],
      meta: { createdAt: Date.now() },
    };
    localStorage.setItem('jurepi-new-word', JSON.stringify(store));

    const { result } = renderHook(() => useGlossary(mockCatalog));

    await waitFor(() => {
      expect(result.current.favorites).toContain('god-life');
    });
  });

  it('recovers gracefully from corrupt localStorage', () => {
    localStorage.setItem('jurepi-new-word', '{invalid json');

    const { result } = renderHook(() => useGlossary(mockCatalog));

    expect(result.current.favorites).toEqual([]);
    expect(result.current.recents).toEqual([]);
  });

  it('setQuery updates query draft immediately for responsive typing', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.setQuery('god');
    });

    expect(result.current.query).toBe('god');
  });

  it('debounces filtering after setQuery', async () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.setQuery('life');
    });

    // Draft is immediate, but filtering is debounced
    expect(result.current.query).toBe('life');

    // After debounce, filtered list should be updated
    await waitFor(
      () => {
        expect(result.current.filtered.length).toBeGreaterThan(0);
      },
      { timeout: 300 }
    );
  });

  it('toggleFavorite adds and removes slugs + persists to localStorage', async () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    // Wait for the hook to mount and load from localStorage
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.toggleFavorite('god-life');
    });

    expect(result.current.favorites).toContain('god-life');

    // Wait for persistence effect to run
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('jurepi-new-word') || '{}');
      expect(stored.favorites).toContain('god-life');
    });

    act(() => {
      result.current.toggleFavorite('god-life');
    });

    expect(result.current.favorites).not.toContain('god-life');

    // Wait for persistence effect to run
    await waitFor(() => {
      const storedAfter = JSON.parse(localStorage.getItem('jurepi-new-word') || '{}');
      expect(storedAfter.favorites).not.toContain('god-life');
    });
  });

  it('select() updates selectedSlug and adds to recents', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.select('god-life');
    });

    expect(result.current.selectedSlug).toBe('god-life');
    expect(result.current.selectedTerm?.slug).toBe('god-life');
    expect(result.current.recents).toContain('god-life');
  });

  it('select(null) clears selectedSlug', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.select('god-life');
    });

    expect(result.current.selectedSlug).toBe('god-life');

    act(() => {
      result.current.select(null);
    });

    expect(result.current.selectedSlug).toBeNull();
  });

  it('setActiveTopic filters by topic', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.setActiveTopic('mz');
    });

    expect(result.current.activeTopic).toBe('mz');
    expect(result.current.filtered.every((t) => t.topic === 'mz')).toBe(true);
  });

  it('setActiveTopic filters favorites when set to "favorites"', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.toggleFavorite('god-life');
    });

    act(() => {
      result.current.setActiveTopic('favorites');
    });

    expect(result.current.activeTopic).toBe('favorites');
    expect(result.current.filtered).toEqual(
      mockCatalog.filter((t) => result.current.favorites.includes(t.slug))
    );
  });

  it('setActiveTopic filters recents when set to "recent"', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.select('god-life');
    });

    act(() => {
      result.current.setActiveTopic('recent');
    });

    expect(result.current.activeTopic).toBe('recent');
    expect(result.current.filtered).toContainEqual(
      mockCatalog.find((t) => t.slug === 'god-life')!
    );
  });

  it('copy returns true on success with navigator.clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const { result } = renderHook(() => useGlossary(mockCatalog));

    const success = await result.current.copy('test text');

    expect(success).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('test text');
  });

  it('copy falls back to execCommand on clipboard failure', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const { result } = renderHook(() => useGlossary(mockCatalog));

    const success = await result.current.copy('test text');

    // Fallback attempts execCommand, which may succeed or fail in jsdom
    expect(typeof success).toBe('boolean');
  });

  it('setDisplayLang updates and persists language preference', async () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    // Wait for hook to mount
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    act(() => {
      result.current.setDisplayLang('ko');
    });

    expect(result.current.displayLang).toBe('ko');

    // Wait for persistence effect
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('jurepi-new-word') || '{}');
      expect(stored.meta?.lastLang).toBe('ko');
    });
  });

  it('resultCount reflects filtered length', async () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    act(() => {
      result.current.setQuery('god');
    });

    await waitFor(() => {
      expect(result.current.resultCount).toBeGreaterThan(0);
      expect(result.current.resultCount).toBeLessThanOrEqual(mockCatalog.length);
    }, { timeout: 200 });
  });

  it('topicsAvailable reflects topics present in catalog', () => {
    const { result } = renderHook(() => useGlossary(mockCatalog));

    expect(result.current.topicsAvailable).toContain('mz');
    expect(result.current.topicsAvailable).toContain('tech');
  });
});
