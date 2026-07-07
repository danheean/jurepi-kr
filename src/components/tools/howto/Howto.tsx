'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedGuide } from '@/lib/howto/schema';
import guidesData from './data/guides.generated.json';
import { Toast } from '@/components/ui/Toast';
import { useHowto } from './useHowto';
import { GuideSearch } from './GuideSearch';
import { TopicTabs } from './TopicTabs';
import { GuideList } from './GuideList';

const CATALOG = guidesData as MergedGuide[];

export function Howto() {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.howto');
  const h = useHowto(CATALOG);

  const [toast, setToast] = useState<string | null>(null);

  const handleToggleFav = (slug: string) => {
    const wasFav = h.favorites.includes(slug);
    h.toggleFavorite(slug);
    setToast(wasFav ? t('card.unfavorite') : t('card.favorite'));
  };

  return (
    <div className="space-y-4">
      {/* Hub SPA only — SEO/GEO sections (Intro/HowTo/Faq/StructuredData) are
          owned by the tool route so they render once in prerendered HTML. */}
      <GuideSearch
        query={h.query}
        setQuery={h.setQuery}
        resultCount={h.resultCount}
      />
      <TopicTabs
        activeTopic={h.activeTopic}
        setActiveTopic={h.setActiveTopic}
        favCount={h.favorites.length}
        recentCount={h.recents.length}
      />
      <GuideList
        guides={h.filtered}
        favorites={h.favorites}
        query={h.query}
        activeTopic={h.activeTopic}
        onToggleFav={handleToggleFav}
        onClearQuery={() => h.setQuery('')}
        currentLocale={locale}
      />

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
