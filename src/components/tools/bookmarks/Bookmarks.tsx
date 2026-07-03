'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { MergedTopic } from '@/lib/bookmarks/schema';
import bookmarksData from './data/bookmarks.generated.json';
import { Toast } from '@/components/ui/Toast';
import { useBookmarksCatalog } from './useBookmarksCatalog';
import { BookmarksSearch } from './BookmarksSearch';
import { TopicTabs } from './TopicTabs';
import { TopicsList } from './TopicsList';
import { TopicDetail } from './TopicDetail';
import { BookmarksIntro } from './BookmarksIntro';
import { BookmarksHowTo } from './BookmarksHowTo';
import { BookmarksFaq } from './BookmarksFaq';
import { BookmarksStructuredData } from './BookmarksStructuredData';

// Static catalog import: available at SSR/prerender time
const CATALOG = bookmarksData as MergedTopic[];

export function Bookmarks() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.bookmarks');
  const r = useBookmarksCatalog(CATALOG);

  const [toast, setToast] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Detail focus management: move focus + scroll to the panel on open, and
  // return focus to the card that opened it on close. Without this, selecting a
  // topic renders the detail below the whole grid (off-screen on mobile) with no
  // signal to keyboard/SR users that anything happened.
  const detailRef = useRef<HTMLElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const selectedSlug = r.selectedSlug;

  // On select, bring the detail panel into view and focus it.
  useEffect(() => {
    if (selectedSlug && detailRef.current) {
      detailRef.current.focus({ preventScroll: true });
      detailRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [selectedSlug, prefersReducedMotion]);

  const handleSelect = useCallback(
    (slug: string | null) => {
      if (slug) {
        lastTriggerRef.current = document.activeElement as HTMLElement | null;
      }
      r.select(slug);
    },
    [r]
  );

  const handleCloseDetail = useCallback(() => {
    r.select(null);
    // Restore focus to the originating card after the panel unmounts.
    requestAnimationFrame(() => lastTriggerRef.current?.focus?.());
  }, [r]);

  const handleToggleFav = useCallback(
    (slug: string) => {
      const wasFav = r.favorites.includes(slug);
      r.toggleFavorite(slug);
      setToast(wasFav ? t('toast.favoriteRemoved') : t('toast.favoriteAdded'));
    },
    [r, t]
  );

  const handleClearQuery = useCallback(() => {
    r.setQuery('');
  }, [r]);

  return (
    <div className="space-y-16">
      {/* SEO/GEO: rendered unconditionally so it lands
          in the prerendered HTML for search engines and answer engines. */}
      <BookmarksIntro />

      {/* Interactive bookmarks island. Stacked on mobile; on desktop it splits
          into a two-pane layout (selector left, sticky detail right) once a
          topic is picked, so the detail no longer sits below the whole grid. */}
      <div
        className={`space-y-6 ${
          r.selectedTopic
            ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-6 lg:space-y-0'
            : ''
        }`}
      >
          <div className="min-w-0 space-y-4">
            <BookmarksSearch
              query={r.query}
              setQuery={r.setQuery}
              resultCount={r.resultCount}
            />
            <TopicTabs
              activeTab={r.activeTab}
              setActiveTab={r.setActiveTab}
              favCount={r.favorites.length}
              recentCount={r.recents.length}
            />
            {/* Scopes the h3 topic-card headings under an h2, keeping the
                page heading order h1 → h2 → h3 (no skipped level). */}
            <h2 className="sr-only">{t('list.regionHeading')}</h2>
            <TopicsList
              topics={r.filtered}
              selectedSlug={r.selectedSlug}
              favorites={r.favorites}
              query={r.query}
              onSelect={handleSelect}
              onToggleFavorite={handleToggleFav}
              onClearQuery={handleClearQuery}
              locale={locale}
              detailOpen={!!r.selectedTopic}
            />
          </div>

        {/* Detail: full-width panel, only shown once a topic is picked */}
        {r.selectedTopic && (
          <section
            ref={detailRef}
            tabIndex={-1}
            aria-labelledby="bookmarks-detail-heading"
            className="scroll-mt-20 rounded-3xl border border-hairline bg-surface p-6 shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
          >
            <TopicDetail
              topic={r.selectedTopic}
              onClose={handleCloseDetail}
              locale={locale}
            />
          </section>
        )}
      </div>

      {/* SEO/GEO sections */}
      <BookmarksHowTo />
      <BookmarksFaq />
      <BookmarksStructuredData catalog={CATALOG} />

      {toast && (
        <Toast
          message={toast}
          type="success"
          open={!!toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
