'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { SearchableTool } from '@/lib/tool-search';
import type { ToolCategory } from '@/tools/types';
import { useToolSearch } from '@/hooks/useToolSearch';
import { useHomeFavorites } from '@/hooks/useHomeFavorites';
import { isInFavorites } from '@/lib/home-favorites/favorites';
import { SearchBar } from './SearchBar';
import { CategoryFilter } from './CategoryFilter';
import { ToolGrid } from './ToolGrid';
import { FavoritesFilterToggle } from './FavoritesFilterToggle';

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
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Get live tool slugs for favorites hook
  const liveSlugs = useMemo(
    () =>
      initialTools.filter((t) => t.status === 'live').map((t) => t.slug),
    [initialTools]
  );

  // Initialize favorites state
  const { favoriteIds, toggleFavorite } = useHomeFavorites(liveSlugs);

  // Hydrate from the URL once, on the client only (keeps SSR static).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q') ?? '';
    const urlCat = params.get('cat');
    const urlFavorites = params.get('favorites') === 'true';

    if (urlQuery) setQuery(urlQuery);
    if (urlCat && categories.some((c) => c.id === urlCat)) {
      setCategory(urlCat as ToolCategory | 'all');
    }
    if (urlFavorites) setFavoritesOnly(true);

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
    if (favoritesOnly) params.set('favorites', 'true');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [query, category, favoritesOnly]);

  // Apply favorites filter if enabled
  const visible = favoritesOnly
    ? results.filter(
        (t) => t.status === 'live' && isInFavorites(favoriteIds, t.slug)
      )
    : results;

  // Check if empty because of favorites filter (vs other search/category filters)
  const isEmptyBecauseFavorites =
    visible.length === 0 &&
    favoritesOnly &&
    query.trim() === '' &&
    category === 'all';

  // Include favoritesOnly in filtered state for result count display
  const anyFilter = isFiltered || favoritesOnly;

  return (
    <section
      aria-labelledby="tools-heading"
      className="bg-background pt-4 pb-16 md:pt-6 md:pb-20 lg:pb-24"
    >
      <h2 id="tools-heading" className="sr-only">
        {t('toolsHeading')}
      </h2>
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

        {/* Category pills + favorites filter as a grouped control block.
            Favorites sits on its OWN row (below, left-aligned) — not inline
            with the category pills — so it reads as a distinct filter action
            and never eats horizontal space from the category scroll row on
            narrow viewports. */}
        <div className="space-y-4">
          <CategoryFilter
            categories={categories}
            active={category}
            onChange={setCategory}
          />
          <div className="mx-auto max-w-container px-6 md:px-8 lg:px-12">
            <FavoritesFilterToggle
              active={favoritesOnly}
              onToggle={() => setFavoritesOnly((v) => !v)}
              count={favoriteIds.length}
            />
          </div>
        </div>

        {anyFilter && visible.length > 0 && (
          <div className="mx-auto max-w-container px-6 md:px-8 lg:px-12">
            <p className="text-sm text-text-muted" aria-live="polite">
              {t('resultCount', { count: visible.length })}
            </p>
          </div>
        )}

        <ToolGrid
          tools={visible}
          isFiltered={anyFilter}
          onReset={() => {
            reset();
            setFavoritesOnly(false);
          }}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          isEmptyBecauseFavorites={isEmptyBecauseFavorites}
          onShowAll={() => setFavoritesOnly(false)}
          testId={testId ? `${testId}-grid` : undefined}
        />
      </div>
    </section>
  );
}
