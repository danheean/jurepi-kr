'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedRanking } from '@/lib/rankings/schema';
import rankingsData from './data/rankings.generated.json';
import { Toast } from '@/components/ui/Toast';
import { useRankingsCatalog } from './useRankingsCatalog';
import { RankingSearch } from './RankingSearch';
import { FieldTabs } from './FieldTabs';
import { RankingsList } from './RankingsList';
import { RankingDetail } from './RankingDetail';
import { RankingsIntro } from './RankingsIntro';
import { RankingsHowTo } from './RankingsHowTo';
import { RankingsFaq } from './RankingsFaq';
import { RankingsStructuredData } from './RankingsStructuredData';

// Static catalog import: available at SSR/prerender time
const CATALOG = rankingsData as MergedRanking[];

export function Rankings() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.rankings');
  const r = useRankingsCatalog(CATALOG);

  const [toast, setToast] = useState<string | null>(null);

  const handleToggleFav = useCallback(
    (slug: string) => {
      const wasFav = r.favorites.includes(slug);
      r.toggleFavorite(slug);
      setToast(wasFav ? t('toast.favoriteRemoved') : t('toast.favoriteAdded'));
    },
    [r, t]
  );

  return (
    <div className="space-y-16">
      {/* SEO/GEO: rendered unconditionally (outside mounted gate) so it lands
          in the prerendered HTML for search engines and answer engines. */}
      <RankingsIntro />

      {/* Interactive rankings island. A ranking is a wide, long table, so the
          detail is rendered FULL-WIDTH below the selector (not a narrow sticky
          sidebar) — otherwise the description column wraps character-by-character
          and half the viewport sits empty. Selector on top, detail below.
          Rendered outside any mounted gate so the card grid (and its crawlable
          spoke links) lands in the prerendered HTML — favorites/recents load
          client-side via useEffect (SSR-safe empty initial state). */}
      <div className="space-y-6">
          <div className="min-w-0 space-y-4">
            <RankingSearch
              query={r.query}
              setQuery={r.setQuery}
              resultCount={r.resultCount}
            />
            <FieldTabs
              activeField={r.activeField}
              setActiveField={r.setActiveField}
              fieldsAvailable={r.fieldsAvailable}
              favCount={r.favorites.length}
              recentCount={r.recents.length}
            />
            <RankingsList
              rankings={r.filtered}
              selectedSlug={r.selectedSlug}
              favorites={r.favorites}
              query={r.query}
              activeField={r.activeField}
              onSelect={r.select}
              onToggleFavorite={handleToggleFav}
              onClearQuery={() => r.setQuery('')}
            />
          </div>

          {/* Detail: full-width panel, only shown once a ranking is picked */}
          {r.selectedRanking && (
            <section className="rounded-3xl border border-hairline bg-surface p-6 shadow-card">
              <RankingDetail
                ranking={r.selectedRanking}
                onClose={() => r.select(null)}
              />
            </section>
          )}
      </div>

      {/* SEO/GEO sections */}
      <RankingsHowTo />
      <RankingsFaq />
      <RankingsStructuredData catalog={CATALOG} />

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
