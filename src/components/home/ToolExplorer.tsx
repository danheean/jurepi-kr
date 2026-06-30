'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { SearchableTool } from '@/lib/tool-search';
import type { ToolCategory } from '@/tools/types';
import { useToolSearch } from '@/hooks/useToolSearch';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { ToolGrid } from './ToolGrid';

interface ToolExplorerProps {
  initialTools: SearchableTool[];
  testId?: string;
}

/**
 * ToolExplorer: client container for search + category state.
 *
 * It initializes from defaults so the FULL grid renders in the server HTML
 * (crawlable tool links + fast LCP). It does NOT use useSearchParams (which
 * would force a client-only bailout). Instead it hydrates filter state from the
 * URL once after mount and reflects later changes back to the URL via
 * history.replaceState — shareable on reload, without de-opting SSR.
 */
export function ToolExplorer({
  initialTools,
  testId,
}: ToolExplorerProps): React.ReactNode {
  const t = useTranslations('home');
  const {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    results,
    isFiltered,
    reset,
  } = useToolSearch(initialTools);
  const hydratedRef = useRef(false);

  // Hydrate from the URL once, on the client only (keeps SSR static).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q') ?? '';
    const urlCat = params.get('cat');
    if (urlQuery) setQuery(urlQuery);
    if (urlCat && categories.some((c) => c.id === urlCat)) {
      setCategory(urlCat as ToolCategory | 'all');
    }
    hydratedRef.current = true;
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect state to the URL (shareable) without triggering navigation.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    if (category !== 'all') params.set('cat', category);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [query, category]);

  return (
    <div className="bg-surface py-16 md:py-20 lg:py-24">
      <div className="space-y-12">
        <div className="mx-auto max-w-container px-6 md:px-8 lg:px-12">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={t('searchPlaceholder')}
            id="tool-search"
            ariaLabel={t('searchAria')}
          />
        </div>

        <CategoryFilter
          categories={categories}
          active={category}
          onChange={setCategory}
        />

        {isFiltered && results.length > 0 && (
          <div className="mx-auto max-w-container px-6 md:px-8 lg:px-12">
            <p className="text-sm text-text-muted" aria-live="polite">
              {t('resultCount', { count: results.length })}
            </p>
          </div>
        )}

        <ToolGrid
          tools={results}
          isFiltered={isFiltered}
          onReset={reset}
          testId={testId ? `${testId}-grid` : undefined}
        />
      </div>
    </div>
  );
}
