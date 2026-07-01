import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MergedTerm } from '@/lib/new-word/schema';
import { TermCard } from './TermCard';

interface TermListProps {
  terms: MergedTerm[];
  selectedSlug: string | null;
  favorites: string[];
  query: string;
  activeTopic: 'all' | 'mz' | 'tech' | 'favorites' | 'recent';
  onSelect: (slug: string) => void;
  onToggleFav: (slug: string) => void;
  onClearQuery: () => void;
  currentLocale: 'ko' | 'en';
}

export function TermList({
  terms,
  selectedSlug,
  favorites,
  query,
  activeTopic,
  onSelect,
  onToggleFav,
  onClearQuery,
  currentLocale,
}: TermListProps) {
  const t = useTranslations('tools.new-word');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = containerRef.current?.querySelectorAll('[role="button"]') ?? [];
      const currentIdx = Array.from(items).findIndex(
        (item) => document.activeElement === item
      );

      let nextIdx = -1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIdx = currentIdx < items.length - 1 ? currentIdx + 1 : 0;
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIdx = currentIdx > 0 ? currentIdx - 1 : items.length - 1;
          break;
        case 'ArrowLeft':
          if (currentIdx > 0) {
            e.preventDefault();
            nextIdx = currentIdx - 1;
          }
          break;
        case 'ArrowRight':
          if (currentIdx < items.length - 1) {
            e.preventDefault();
            nextIdx = currentIdx + 1;
          }
          break;
        case 'Home':
          e.preventDefault();
          nextIdx = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIdx = items.length - 1;
          break;
        case 'Enter':
        case ' ':
          if (currentIdx >= 0) {
            e.preventDefault();
            (items[currentIdx] as HTMLButtonElement).click();
          }
          break;
        case 'f':
          if (currentIdx >= 0) {
            e.preventDefault();
            const card = items[currentIdx] as HTMLButtonElement;
            const starBtn = card.querySelector('[aria-pressed]') as HTMLButtonElement;
            starBtn?.click();
          }
          break;
      }

      if (nextIdx >= 0 && nextIdx < items.length) {
        (items[nextIdx] as HTMLButtonElement).focus();
      }
    },
    []
  );

  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-text-muted mb-2">
          {query
            ? t('empty.noResults', { query })
            : activeTopic === 'favorites'
              ? t('empty.favorites')
              : t('empty.recent')}
        </p>
        {query && (
          <button
            onClick={onClearQuery}
            className="text-sm text-brand hover:underline"
          >
            {t('search.clear')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="term-list"
      role="list"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      {terms.map((term) => (
        <div key={term.slug} role="listitem">
          <TermCard
            term={term}
            isSelected={selectedSlug === term.slug}
            isFavorite={favorites.includes(term.slug)}
            onSelect={onSelect}
            onToggleFav={onToggleFav}
            currentLocale={currentLocale}
          />
        </div>
      ))}
    </div>
  );
}
