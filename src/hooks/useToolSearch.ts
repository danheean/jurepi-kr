'use client';

import { useState, useEffect, useRef } from 'react';
import {
  SearchableTool,
  filterTools,
  sortTools,
  deriveCategories,
  type CategoryOption,
} from '@/lib/tool-search';
import type { ToolCategory } from '@/tools/types';

interface UseToolSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  category: ToolCategory | 'all';
  setCategory: (c: ToolCategory | 'all') => void;
  categories: CategoryOption[];
  results: SearchableTool[];
  isFiltered: boolean;
  reset: () => void;
}

/**
 * useToolSearch: wraps domain search logic with React state + debounce.
 * Debounce ~120ms on query input.
 * Manages query + category state.
 */
export function useToolSearch(
  initialTools: SearchableTool[]
): UseToolSearchReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory | 'all'>('all');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Debounce query (120ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 120);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Derive categories from initial tools
  const categories = deriveCategories(initialTools);

  // Filter and sort results
  const results = sortTools(
    filterTools(initialTools, {
      query: debouncedQuery,
      category,
    })
  );

  // Check if any filter is active
  const isFiltered = query.trim() !== '' || category !== 'all';

  const reset = () => {
    setQuery('');
    setDebouncedQuery('');
    setCategory('all');
  };

  return {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    results,
    isFiltered,
    reset,
  };
}
