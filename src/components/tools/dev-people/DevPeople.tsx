'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { MergedPerson } from '@/lib/dev-people/schema';
import devPeopleData from './data/dev-people.generated.json';
import { Toast } from '@/components/ui/Toast';
import { useDevPeopleCatalog } from './useDevPeopleCatalog';
import { PeopleSearch } from './PeopleSearch';
import { TagTabs } from './TagTabs';
import { EraTabs } from './EraTabs';
import { PeopleList } from './PeopleList';

// Static catalog import: available at SSR/prerender time
const CATALOG = devPeopleData.peoples as MergedPerson[];

export function DevPeople() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.dev-people');
  const r = useDevPeopleCatalog(CATALOG);

  const [toast, setToast] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

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
      {/* SEO 섹션(Intro/HowTo/Faq/StructuredData)은 라우트가 소유 — 여기서 렌더하면 이중 JSON-LD */}
      {/* Interactive hub SPA */}
      <div className="space-y-4">
        <div className="space-y-4">
          <PeopleSearch
            query={r.query}
            setQuery={r.setQuery}
            resultCount={r.resultCount}
          />
          <TagTabs
            selectedTag={r.selectedTag}
            onSelectTag={r.setTag}
            favCount={r.favorites.length}
            recentCount={r.recents.length}
          />
          <EraTabs
            selectedEra={r.selectedEra}
            onSelectEra={r.setEra}
          />

          {/* Scopes the h3 person-card headings under an h2 */}
          <h2 className="sr-only">{t('list.regionHeading')}</h2>
          <PeopleList
            people={r.filtered}
            favorites={r.favorites}
            query={r.query}
            onToggleFavorite={handleToggleFav}
            onClearQuery={handleClearQuery}
            locale={locale}
          />
        </div>
      </div>

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
