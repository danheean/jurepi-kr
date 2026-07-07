'use client';

import { useTranslations } from 'next-intl';
import type { MergedGuide } from '@/lib/howto/schema';
import { GuideCard } from './GuideCard';

interface GuideListProps {
  guides: MergedGuide[];
  favorites: string[];
  query: string;
  activeTopic: string;
  onToggleFav: (slug: string) => void;
  onClearQuery: () => void;
  currentLocale: 'ko' | 'en';
}

export function GuideList({
  guides,
  favorites,
  query,
  activeTopic,
  onToggleFav,
  onClearQuery,
  currentLocale,
}: GuideListProps) {
  const t = useTranslations('tools.howto');

  if (guides.length === 0) {
    return (
      <div className="text-center py-12">
        {query ? (
          <>
            <p className="text-text-secondary mb-4">
              {t('empty.noResults', { query })}
            </p>
            <button
              onClick={onClearQuery}
              className="px-4 py-2 rounded-lg bg-brand text-on-brand font-medium hover:opacity-90 transition-opacity"
            >
              {t('search.clear')}
            </button>
          </>
        ) : activeTopic === 'favorites' ? (
          <p className="text-text-secondary">
            {t('empty.noFavorites')}
          </p>
        ) : activeTopic === 'recent' ? (
          <p className="text-text-secondary">
            {t('empty.noRecent')}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {guides.map((guide) => (
        <GuideCard
          key={guide.slug}
          guide={guide}
          isFavorite={favorites.includes(guide.slug)}
          onToggleFav={onToggleFav}
          currentLocale={currentLocale}
        />
      ))}
    </div>
  );
}
