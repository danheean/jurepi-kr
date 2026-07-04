import { useTranslations } from 'next-intl';
import { Star, Clock } from 'lucide-react';

/**
 * Context-aware empty state for the place list.
 * - noMatches: active filters/search matched nothing → offer a filter reset
 * - noFavorites: favorites tab with nothing starred yet
 * - noRecents: recents tab with no viewing history yet
 */
export type PlaceListEmptyVariant = 'noMatches' | 'noFavorites' | 'noRecents';

export interface PlaceListEmptyProps {
  variant: PlaceListEmptyVariant;
  onResetFilters: () => void;
}

export function PlaceListEmpty({ variant, onResetFilters }: PlaceListEmptyProps) {
  const t = useTranslations('tools.restaurant-map');

  if (variant === 'noFavorites') {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-surface-muted p-6 text-center">
        <Star className="h-12 w-12 text-text-secondary opacity-50" aria-hidden />
        <h3 className="text-lg font-semibold text-text">{t('empty.noFavorites')}</h3>
      </div>
    );
  }

  if (variant === 'noRecents') {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-surface-muted p-6 text-center">
        <Clock className="h-12 w-12 text-text-secondary opacity-50" aria-hidden />
        <h3 className="text-lg font-semibold text-text">{t('empty.noRecents')}</h3>
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-surface-muted p-6 text-center">
      <div className="text-5xl" aria-hidden>
        🔍
      </div>
      <h3 className="text-lg font-semibold text-text">{t('empty.noMatches')}</h3>
      <button
        onClick={onResetFilters}
        className="rounded-lg bg-brand px-4 py-2 text-on-brand transition-colors hover:bg-brand-strong"
      >
        {t('buttons.resetFilters')}
      </button>
    </div>
  );
}
