'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { DeckCard } from './DeckCard';
import { SoundToggle } from './SoundToggle';
import type { UseSpeedQuizReturn } from './useSpeedQuiz';
import type { MergedDeck } from '@/lib/speed-quiz/schema';

interface DeckBrowserProps {
  quiz: UseSpeedQuizReturn;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function DeckBrowser({ quiz, inputRef }: DeckBrowserProps) {
  const t = useTranslations('tools.speed-quiz');

  // Category options: 'all' + each category + 'favorites'
  const categoryOptions = [
    { value: 'all', label: t('categories.all') },
    { value: 'animals', label: t('categories.animals') },
    { value: 'food', label: t('categories.food') },
    { value: 'sports', label: t('categories.sports') },
    { value: 'movies', label: t('categories.movies') },
    { value: 'kpop', label: t('categories.kpop') },
    { value: 'countries', label: t('categories.countries') },
    { value: 'jobs', label: t('categories.jobs') },
    { value: 'brands', label: t('categories.brands') },
    { value: 'proverbs', label: t('categories.proverbs') },
    { value: 'historical-figures', label: t('categories.historical-figures') },
    quiz.favorites.length > 0 && { value: 'favorites', label: t('categories.favorites') },
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  const hasFavorites = quiz.favorites.length > 0;
  const showFavoritesTab = quiz.activeCategory === 'favorites' || hasFavorites;

  return (
    <div className="w-full">
      {/* Search & Sound */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={t('search.placeholder')}
            value={quiz.query}
            onChange={(e) => quiz.setQuery(e.target.value)}
            className="w-full px-4 py-3 border border-hairline rounded-lg bg-surface text-text placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            data-testid="deck-search-input"
          />
          {quiz.query && (
            <button
              onClick={() => quiz.setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              aria-label={t('search.clear')}
              data-testid="deck-search-clear"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <SoundToggle
          soundOn={quiz.soundOn}
          onToggle={quiz.toggleSound}
        />
      </div>

      {/* Category filters — a group of toggle buttons (aria-pressed), not tabs
          (there is no tabpanel; selecting one filters the grid in place). */}
      <div
        className="flex flex-wrap gap-2 mb-8"
        data-testid="deck-category-tabs"
      >
        {categoryOptions.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => quiz.setActiveCategory(value as any)}
            aria-pressed={quiz.activeCategory === value}
            className={`px-4 py-2 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              quiz.activeCategory === value
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text-secondary hover:bg-hairline'
            }`}
            data-testid={`deck-category-${value}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Deck grid */}
      {quiz.filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">
            {quiz.query
              ? t('search.noResults', { query: quiz.query })
              : t('empty.noDecks')}
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          data-testid="deck-grid"
        >
          {quiz.filtered.map((deck) => (
            <DeckCard
              key={deck.slug}
              deck={deck}
              isFavorite={quiz.favorites.includes(deck.slug)}
              onFavorite={() => quiz.toggleFavorite(deck.slug)}
              onSelect={() => quiz.openSetup(deck.slug)}
              wordCountLabel={t('deck.wordCount', { count: deck.words.length })}
              addFavoriteLabel={t('deck.addFavorite')}
              removeFavoriteLabel={t('deck.removeFavorite')}
              difficultyLabel={t(`difficulty.${deck.difficulty}`)}
              categoryLabel={t(`categories.${deck.category}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
