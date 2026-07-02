'use client';

import { useLocale } from 'next-intl';
import { Star } from 'lucide-react';
import type { MergedDeck } from '@/lib/speed-quiz/schema';

interface DeckCardProps {
  deck: MergedDeck;
  isFavorite: boolean;
  onFavorite: () => void;
  onSelect: () => void;
  wordCountLabel: string;
  addFavoriteLabel: string;
  removeFavoriteLabel: string;
  difficultyLabel: string;
  categoryLabel: string;
}

/**
 * Individual deck card: title, category badge, difficulty stars, word count, favorite toggle.
 * ≥48px tap targets, hover/focus/press states.
 */
export function DeckCard({
  deck,
  isFavorite,
  onFavorite,
  onSelect,
  wordCountLabel,
  addFavoriteLabel,
  removeFavoriteLabel,
  difficultyLabel,
  categoryLabel,
}: DeckCardProps) {
  const locale = useLocale() as 'ko' | 'en';
  // Difficulty stars
  const stars =
    deck.difficulty === 'easy'
      ? '⭐'
      : deck.difficulty === 'normal'
        ? '⭐⭐'
        : '⭐⭐⭐';

  // Accent color per category
  const accentClass = {
    animals: 'bg-accent-coral-soft',
    food: 'bg-accent-mint-soft',
    sports: 'bg-accent-sky-soft',
    movies: 'bg-accent-sun-soft',
    kpop: 'bg-accent-grape-soft',
    countries: 'bg-accent-sky-soft',
    jobs: 'bg-accent-coral-soft',
    brands: 'bg-accent-sun-soft',
    proverbs: 'bg-accent-grape-soft',
    'historical-figures': 'bg-accent-rose-soft',
  }[deck.category] || 'bg-accent-sun-soft';

  const textClass = {
    animals: 'text-accent-coral',
    food: 'text-accent-mint-ink',
    sports: 'text-accent-sky',
    movies: 'text-accent-sun-ink',
    kpop: 'text-accent-grape-ink',
    countries: 'text-accent-sky',
    jobs: 'text-accent-coral',
    brands: 'text-accent-sun-ink',
    proverbs: 'text-accent-grape-ink',
    'historical-figures': 'text-accent-rose-ink',
  }[deck.category] || 'text-accent-sun-ink';

  return (
    // Relative wrapper is non-interactive; the card and the favorite are two
    // sibling buttons (no nested interactive controls).
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left bg-surface border border-hairline rounded-lg p-5 hover:shadow-card-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        data-testid={`deck-card-${deck.slug}`}
      >
        {/* Title (padded right to clear the favorite button) */}
        <h3 className="text-lg font-bold text-text line-clamp-2 pr-12 mb-3">
          {deck[locale === 'en' ? 'en' : 'ko'].title}
        </h3>

        {/* Category badge */}
        <div className="mb-3">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${accentClass} ${textClass}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Difficulty stars + Word count */}
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span role="img" aria-label={difficultyLabel}>
            {stars}
          </span>
          <span>{wordCountLabel}</span>
        </div>
      </button>

      {/* Favorite toggle — sibling of the card button, ≥44px hit area */}
      <button
        type="button"
        onClick={onFavorite}
        className="absolute top-3 right-3 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? removeFavoriteLabel : addFavoriteLabel}
        data-testid={`deck-favorite-${deck.slug}`}
      >
        <Star
          size={20}
          className={`${
            isFavorite ? 'fill-brand text-brand' : 'text-text-secondary'
          } transition-colors`}
        />
      </button>
    </div>
  );
}
