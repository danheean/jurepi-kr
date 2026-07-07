import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHowto } from './useHowto';
import type { MergedGuide } from '@/lib/howto/schema';

const mockGuides: MergedGuide[] = [
  {
    slug: 'install-claude-code',
    topic: 'setup',
    order: 1,    tags: ['claude-code', 'cli'],
    related: ['issue-api-token'],
    updated: '2026-07-06T00:00:00.000Z',
    difficulty: 'beginner',
    ko: {
      title: 'Setup Guide 1',
      summary: 'Summary 1',
      body: 'Body 1',
    },
    en: {
      title: 'Setup Guide 1',
      summary: 'Summary 1',
      body: 'Body 1',
    },
  },
  {
    slug: 'git-worktree',
    topic: 'git',
    order: 1,    tags: ['git', 'worktree'],
    related: [],
    updated: '2026-07-06T00:00:00.000Z',
    difficulty: 'intermediate',
    ko: {
      title: 'Git Guide 1',
      summary: 'Summary 2',
      body: 'Body 2',
    },
    en: {
      title: 'Git Guide 1',
      summary: 'Summary 2',
      body: 'Body 2',
    },
  },
  {
    slug: 'issue-api-token',
    topic: 'api',
    order: 1,    tags: ['api', 'token'],
    related: ['install-claude-code'],
    updated: '2026-07-06T00:00:00.000Z',
    difficulty: 'beginner',
    ko: {
      title: 'API Guide 1',
      summary: 'Summary 3',
      body: 'Body 3',
    },
    en: {
      title: 'API Guide 1',
      summary: 'Summary 3',
      body: 'Body 3',
    },
  },
];

describe('useHowto', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('toggles favorite and persists to localStorage with initialCatalog', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    // Catalog should be immediately available when passed in
    expect(result.current.catalog).toEqual(mockGuides);

    // Toggle favorite
    act(() => {
      result.current.toggleFavorite('install-claude-code');
    });

    expect(result.current.favorites).toContain('install-claude-code');

    // Check localStorage
    const stored = localStorage.getItem('jurepi-howto');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.favorites).toContain('install-claude-code');
  });

  it('persists favorites to localStorage', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.toggleFavorite('install-claude-code');
      result.current.toggleFavorite('git-worktree');
    });

    expect(result.current.favorites).toHaveLength(2);

    // Verify localStorage
    const stored = localStorage.getItem('jurepi-howto');
    const parsed = JSON.parse(stored!);
    expect(parsed.favorites).toContain('install-claude-code');
    expect(parsed.favorites).toContain('git-worktree');
  });

  it('sets and updates query', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.setQuery('git');
    });

    // Query is set
    expect(result.current.query).toBe('git');
  });

  it('filters guides by active topic', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    // Filter by setup topic
    act(() => {
      result.current.setActiveTopic('setup');
    });

    expect(result.current.filtered).toContainEqual(
      expect.objectContaining({ topic: 'setup' })
    );
    expect(result.current.filtered).not.toContainEqual(
      expect.objectContaining({ topic: 'git' })
    );
  });

  it('filters by favorites tab', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.toggleFavorite('install-claude-code');
      result.current.toggleFavorite('git-worktree');
    });

    act(() => {
      result.current.setActiveTopic('favorites');
    });

    expect(result.current.filtered).toContainEqual(
      expect.objectContaining({ slug: 'install-claude-code' })
    );
    expect(result.current.filtered).toContainEqual(
      expect.objectContaining({ slug: 'git-worktree' })
    );
    expect(result.current.filtered).toHaveLength(2);
  });

  it('filters by recent tab', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.select('install-claude-code');
      result.current.select('git-worktree');
    });

    act(() => {
      result.current.setActiveTopic('recent');
    });

    expect(result.current.filtered).toContainEqual(
      expect.objectContaining({ slug: 'install-claude-code' })
    );
    expect(result.current.filtered).toContainEqual(
      expect.objectContaining({ slug: 'git-worktree' })
    );
  });

  it('selects a guide and adds to recents', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.select('install-claude-code');
    });

    expect(result.current.selectedSlug).toBe('install-claude-code');
    expect(result.current.selectedGuide).toEqual(mockGuides[0]);
    expect(result.current.recents).toContain('install-claude-code');
  });

  it('deselects a guide', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.select('install-claude-code');
    });

    expect(result.current.selectedSlug).toBe('install-claude-code');

    act(() => {
      result.current.select(null);
    });

    expect(result.current.selectedSlug).toBeNull();
    expect(result.current.selectedGuide).toBeUndefined();
  });

  it('provides available topics from catalog', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    expect(result.current.topicsAvailable).toContain('setup');
    expect(result.current.topicsAvailable).toContain('git');
    expect(result.current.topicsAvailable).toContain('api');
  });

  it('initializes with empty array when no catalog provided', () => {
    const { result } = renderHook(() => useHowto());

    // With no initial catalog, it should be empty
    // (actual loading from guides.generated.json happens in async effect)
    expect(result.current.catalog).toEqual([]);
    expect(result.current.filtered).toEqual([]);
  });

  it('returns result count matching filtered guides', () => {
    const { result } = renderHook(() => useHowto(mockGuides));

    act(() => {
      result.current.setActiveTopic('setup');
    });

    expect(result.current.resultCount).toBe(result.current.filtered.length);
    expect(result.current.resultCount).toBe(1);
  });
});
