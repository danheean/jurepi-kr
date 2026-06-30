import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useToolSearch } from './useToolSearch';
import type { SearchableTool } from '@/lib/tool-search';

describe('useToolSearch', () => {
  const mockTools: SearchableTool[] = [
    {
      id: 'ladder',
      slug: 'ladder',
      name: 'Ladder Game',
      description: 'Play the ladder game fairly',
      category: 'random',
      accent: 'coral',
      icon: 'ListTree',
      status: 'live',
      isPopular: true,
      order: 1,
      keywords: ['ladder', 'fair', 'draw'],
    },
    {
      id: 'wordcounter',
      slug: 'wordcounter',
      name: 'Word Counter',
      description: 'Count words and characters',
      category: 'text',
      accent: 'mint',
      icon: 'Type',
      status: 'coming_soon',
      order: 2,
      keywords: ['word', 'count', 'text'],
    },
    {
      id: 'unitconv',
      slug: 'unitconv',
      name: 'Unit Converter',
      description: 'Convert between units',
      category: 'converter',
      accent: 'sky',
      icon: 'Ruler',
      status: 'coming_soon',
      order: 3,
      keywords: ['convert', 'unit', 'length'],
    },
  ];

  it('initializes with all tools', () => {
    const { result } = renderHook(() => useToolSearch(mockTools));
    expect(result.current.results).toHaveLength(3);
    expect(result.current.results).toEqual(mockTools);
  });

  it('derives categories from tools', () => {
    const { result } = renderHook(() => useToolSearch(mockTools));
    expect(result.current.categories.map(c => c.id)).toContain('all');
    expect(result.current.categories.map(c => c.id)).toContain('random');
    expect(result.current.categories.map(c => c.id)).toContain('text');
  });

  it('filters tools by query', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setQuery('ladder');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].id).toBe('ladder');
    });
  });

  it('filters tools by category', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setCategory('text');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].id).toBe('wordcounter');
    });
  });

  it('combines query and category filters', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setQuery('convert');
      result.current.setCategory('converter');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0].id).toBe('unitconv');
    });
  });

  it('returns empty results when no match', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setQuery('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(0);
    });
  });

  it('sets isFiltered when query is active', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    expect(result.current.isFiltered).toBe(false);

    act(() => {
      result.current.setQuery('ladder');
    });

    await waitFor(() => {
      expect(result.current.isFiltered).toBe(true);
    });
  });

  it('sets isFiltered when category is active', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    expect(result.current.isFiltered).toBe(false);

    act(() => {
      result.current.setCategory('text');
    });

    expect(result.current.isFiltered).toBe(true);
  });

  it('resets query and category', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setQuery('ladder');
      result.current.setCategory('random');
    });

    await waitFor(() => {
      expect(result.current.query).toBe('ladder');
      expect(result.current.category).toBe('random');
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.query).toBe('');
      expect(result.current.category).toBe('all');
      expect(result.current.results).toHaveLength(3);
      expect(result.current.isFiltered).toBe(false);
    });
  });

  it('sorts results: popular first, then by order, then live before coming_soon', () => {
    const unsortedTools: SearchableTool[] = [
      { ...mockTools[1], order: 2 }, // text, coming_soon
      { ...mockTools[0], order: 1, isPopular: true }, // random, live, popular
      { ...mockTools[2], order: 3 }, // converter, coming_soon
    ];

    const { result } = renderHook(() => useToolSearch(unsortedTools));

    // Should be: ladder (popular) → wordcounter (live first) → unitconv (coming_soon)
    expect(result.current.results[0].id).toBe('ladder');
    expect(result.current.results[1].id).toBe('wordcounter');
    expect(result.current.results[2].id).toBe('unitconv');
  });

  it('debounces query updates', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setQuery('l');
    });

    // Immediately should still have old results
    expect(result.current.results).toHaveLength(3);

    act(() => {
      result.current.setQuery('la');
    });

    // Still waiting for debounce
    expect(result.current.results).toHaveLength(3);

    // Wait for debounce (120ms)
    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });
  });

  it('clears results on empty search', async () => {
    const { result } = renderHook(() => useToolSearch(mockTools));

    act(() => {
      result.current.setQuery('ladder');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    act(() => {
      result.current.setQuery('');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(3);
    });
  });
});
