import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDevPeopleCatalog } from './useDevPeopleCatalog';
import type { MergedPerson } from '@/lib/dev-people/schema';

const mockCatalog: MergedPerson[] = [
  {
    slug: 'test-person-1',
    tags: ['ai', 'deep-learning'],
    era: '1980-2000',
    nationality: 'US',
    achievements: [],
    books: [],
    related: [],
    links: [],
    ko: {
      name: '테스트 인물 1',
      knownFor: '인공지능 분야의 선구자로 알려져 있으며 많은 기여를 했다.',
      biography_body: '## 소개\n\n테스트 인물 1입니다.',
    },
    en: {
      name: 'Test Person 1',
      knownFor: 'Pioneer in artificial intelligence and contributor to the field.',
      biography_body: '## About\n\nThis is test person 1.',
    },
    birthYear: 1950,
    deathYear: 2020,
  },
  {
    slug: 'test-person-2',
    tags: ['python', 'education'],
    era: '2000-present',
    nationality: 'UK',
    achievements: [],
    books: [],
    related: [],
    links: [],
    ko: {
      name: '테스트 인물 2',
      knownFor: '파이썬 언어 개발과 교육에 기여했다.',
      biography_body: '## 소개\n\n테스트 인물 2입니다.',
    },
    en: {
      name: 'Test Person 2',
      knownFor: 'Contributor to Python language development and education.',
      biography_body: '## About\n\nThis is test person 2.',
    },
    birthYear: 1960,
  },
];

describe('useDevPeopleCatalog', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with full catalog', () => {
    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    expect(result.current.catalog).toEqual(mockCatalog);
    expect(result.current.filtered).toEqual(mockCatalog);
    expect(result.current.resultCount).toBe(2);
  });

  it('filters by query', async () => {
    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    await act(async () => {
      result.current.setQuery('인물 1');
    });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 150));

    // The filter should work after debounce
    const filtered = result.current.filtered;
    expect(filtered.some((p) => p.slug === 'test-person-1')).toBe(true);
  });

  it('filters by tag', async () => {
    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    await act(async () => {
      result.current.setTag('python' as any);
    });

    const filtered = result.current.filtered;
    expect(filtered.every((p) => p.tags.includes('python'))).toBe(true);
  });

  it('filters by era', async () => {
    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    await act(async () => {
      result.current.setEra('1980-2000');
    });

    const filtered = result.current.filtered;
    expect(filtered.every((p) => p.era === '1980-2000')).toBe(true);
  });

  it('toggles favorite', async () => {
    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    expect(result.current.favorites).toEqual([]);

    await act(async () => {
      result.current.toggleFavorite('test-person-1');
    });

    expect(result.current.favorites).toContain('test-person-1');

    await act(async () => {
      result.current.toggleFavorite('test-person-1');
    });

    expect(result.current.favorites).not.toContain('test-person-1');
  });

  it('persists favorites to localStorage', async () => {
    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    await act(async () => {
      result.current.toggleFavorite('test-person-1');
    });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 350));

    const stored = JSON.parse(localStorage.getItem('jurepi-dev-people') || '{}');
    expect(stored.favorites).toContain('test-person-1');
  });

  it('prunes unknown slugs on load', async () => {
    // Set localStorage with an unknown slug
    const store = {
      version: 1,
      favorites: ['test-person-1', 'unknown-slug'],
      recents: ['unknown-slug'],
      meta: { createdAt: Date.now() },
    };
    localStorage.setItem('jurepi-dev-people', JSON.stringify(store));

    const { result } = renderHook(() => useDevPeopleCatalog(mockCatalog));

    // Wait for mount
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.favorites).not.toContain('unknown-slug');
    expect(result.current.recents).not.toContain('unknown-slug');
  });
});
