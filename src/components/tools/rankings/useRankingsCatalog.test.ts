import { renderHook, act, waitFor } from '@testing-library/react';
import { useRankingsCatalog } from './useRankingsCatalog';
import type { MergedRanking } from '@/lib/rankings/schema';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock catalog
const mockRankings: MergedRanking[] = [
  {
    slug: 'llm-agents',
    field: 'ai',
    asOfDate: '2026-06',
    sourceNote: 'Test source',
    sourceUrl: 'https://example.com',
    ko: {
      title: 'LLM 에이전트',
      items: [
        {
          rank: 1,
          name: 'Claude',
          description: 'Anthropic LLM',
        },
        {
          rank: 2,
          name: 'GPT-5',
          description: 'OpenAI LLM',
        },
        {
          rank: 3,
          name: 'Gemini',
          description: 'Google LLM',
        },
      ],
    },
    en: {
      title: 'LLM Agents',
      items: [
        { rank: 1, name: 'Claude', description: 'Anthropic LLM' },
        { rank: 2, name: 'GPT-5', description: 'OpenAI LLM' },
        { rank: 3, name: 'Gemini', description: 'Google LLM' },
      ],
    },
  },
  {
    slug: 'programming-langs',
    field: 'programming',
    asOfDate: '2026-06',
    sourceNote: 'TIOBE',
    ko: {
      title: '프로그래밍 언어',
      items: [
        { rank: 1, name: 'Python', description: 'Popular' },
        { rank: 2, name: 'JavaScript', description: 'Web' },
        { rank: 3, name: 'Java', description: 'Enterprise' },
      ],
    },
    en: {
      title: 'Programming Languages',
      items: [
        { rank: 1, name: 'Python', description: 'Popular' },
        { rank: 2, name: 'JavaScript', description: 'Web' },
        { rank: 3, name: 'Java', description: 'Enterprise' },
      ],
    },
  },
];

// Mock nextlocale
vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
}));

// Mock dynamic import
vi.mock('./data/rankings.generated.json', () => ({
  default: mockRankings,
}));

describe('useRankingsCatalog', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with catalog', () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    expect(result.current.catalog).toEqual(mockRankings);
    expect(result.current.filtered).toEqual(mockRankings);
  });

  it('filters by query', async () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    await act(async () => {
      result.current.setQuery('Python');
    });

    expect(result.current.resultCount).toBeGreaterThan(0);
  });

  it('filters by field', async () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    await act(async () => {
      result.current.setActiveField('ai');
    });

    expect(result.current.filtered.every((r) => r.field === 'ai')).toBe(true);
  });

  it('filters by query correctly', async () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    act(() => {
      result.current.setQuery('Python');
    });

    await waitFor(() => {
      expect(result.current.resultCount).toBeGreaterThan(0);
    }, { timeout: 300 });
  });

  it('filters by field correctly', async () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    act(() => {
      result.current.setActiveField('ai');
    });

    expect(result.current.filtered.every((r) => r.field === 'ai')).toBe(true);
  });

  it('returns copy function', async () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    const ok = await result.current.copy('test text');
    expect(typeof ok).toBe('boolean');
  });

  it('has available fields', () => {
    const { result } = renderHook(() => useRankingsCatalog(mockRankings));

    expect(result.current.fieldsAvailable.length).toBeGreaterThan(0);
    expect(result.current.fieldsAvailable).toContain('ai');
    expect(result.current.fieldsAvailable).toContain('programming');
  });
});
