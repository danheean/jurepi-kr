'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { DeckCard } from './DeckCard';
import { SoundToggle } from './SoundToggle';
import type { UseCharadesReturn } from './useCharades';
import type { MergedDeck } from '@/lib/charades/schema';

// Category identity color (6-hue accent system) — one distinct hue per
// charades category, shown as a dot on the group heading.
const CATEGORY_DOT: Record<string, string> = {
  actions: 'bg-accent-coral',
  animals: 'bg-accent-mint',
  occupations: 'bg-accent-sky',
  characters: 'bg-accent-grape',
  sports: 'bg-accent-sun',
  emotions: 'bg-accent-rose',
};

interface DeckBrowserProps {
  quiz: UseCharadesReturn;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function DeckBrowser({ quiz, inputRef }: DeckBrowserProps) {
  const t = useTranslations('tools.charades');

  const categoryOptions = [
    { value: 'all', label: t('categories.all') },
    { value: 'actions', label: t('categories.actions') },
    { value: 'animals', label: t('categories.animals') },
    { value: 'occupations', label: t('categories.occupations') },
    { value: 'characters', label: t('categories.characters') },
    { value: 'sports', label: t('categories.sports') },
    { value: 'emotions', label: t('categories.emotions') },
    quiz.favorites.length > 0 && { value: 'favorites', label: t('categories.favorites') },
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  // Group the filtered decks by category (catalog is already category-ordered).
  const groups: Array<{ category: string; decks: MergedDeck[] }> = [];
  for (const deck of quiz.filtered) {
    const last = groups[groups.length - 1];
    if (last && last.category === deck.category) last.decks.push(deck);
    else groups.push({ category: deck.category, decks: [deck] });
  }

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
            className="w-full px-4 py-3 border border-hairline rounded-lg bg-surface text-text placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
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
        <SoundToggle soundOn={quiz.soundOn} onToggle={quiz.toggleSound} />
      </div>

      {/* Category filters — a group of toggle buttons (aria-pressed), not tabs. */}
      <div className="flex flex-wrap gap-2 mb-8" data-testid="deck-category-tabs">
        {categoryOptions.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => quiz.setActiveCategory(value as any)}
            aria-pressed={quiz.activeCategory === value}
            className={`inline-flex items-center min-h-11 px-4 rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
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
            {quiz.query ? t('search.noResults', { query: quiz.query }) : t('empty.noDecks')}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2" data-testid="deck-grid">
          {groups.map(({ category, decks }) => (
            <section key={category} aria-label={t(`categories.${category}`)}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${CATEGORY_DOT[category] || 'bg-accent-mint'}`}
                  aria-hidden="true"
                />
                {t(`categories.${category}`)}
              </h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {decks.map((deck) => (
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
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
