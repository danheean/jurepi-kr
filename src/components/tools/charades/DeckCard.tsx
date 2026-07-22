'use client';

import { useLocale } from 'next-intl';
import { Star } from 'lucide-react';
import type { MergedDeck } from '@/lib/charades/schema';

interface DeckCardProps {
  deck: MergedDeck;
  isFavorite: boolean;
  onFavorite: () => void;
  onSelect: () => void;
  wordCountLabel: string;
  addFavoriteLabel: string;
  removeFavoriteLabel: string;
  difficultyLabel: string;
}

/**
 * Individual deck card: title, difficulty stars, word count, favorite toggle.
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
}: DeckCardProps) {
  const locale = useLocale() as 'ko' | 'en';
  const stars = deck.difficulty === 'easy' ? '⭐' : deck.difficulty === 'normal' ? '⭐⭐' : '⭐⭐⭐';

  return (
    // Relative wrapper is non-interactive; the card and the favorite are two
    // sibling buttons (no nested interactive controls).
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left bg-surface border border-hairline rounded-lg p-5 hover:shadow-card-hover transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        data-testid={`deck-card-${deck.slug}`}
      >
        <h3 className="text-lg font-bold text-text line-clamp-2 pr-12 mb-4">
          {deck[locale === 'en' ? 'en' : 'ko'].title}
        </h3>

        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span role="img" aria-label={difficultyLabel}>
            {stars}
          </span>
          <span>{wordCountLabel}</span>
        </div>
      </button>

      <button
        type="button"
        onClick={onFavorite}
        className="absolute top-3 right-3 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? removeFavoriteLabel : addFavoriteLabel}
        data-testid={`deck-favorite-${deck.slug}`}
      >
        <Star
          size={20}
          className={`${isFavorite ? 'fill-brand text-brand' : 'text-text-secondary'} transition-colors`}
        />
      </button>
    </div>
  );
}
