'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

interface FavoritesFilterToggleProps {
  active: boolean;
  onToggle: () => void;
  /** How many tools are currently saved; shown as a badge when > 0. */
  count?: number;
  testId?: string;
}

/**
 * FavoritesFilterToggle: toggles the "show only my saved tools" filter.
 *
 * Deliberately NOT styled like a CategoryFilter pill. Categories are a
 * mutually-exclusive brand-gold segmented selector ("which kind of tool");
 * this is a personal on/off toggle. To read as a different affordance it uses
 * the rose "favorite" semantic already established on the card heart buttons
 * (FavoriteButton) — an outlined rose chip when off, a filled rose chip when
 * on — plus a saved-count badge. Switching it on beats the heart once
 * (motion-safe; instant under reduced motion), the one earned delight moment.
 */
export function FavoritesFilterToggle({
  active,
  onToggle,
  count = 0,
  testId,
}: FavoritesFilterToggleProps): React.ReactNode {
  const t = useTranslations('home.favorites');

  // Pulse the heart once on the OFF→ON transition. Purely additive transform,
  // gated to motion-safe and cleared on animationend so it re-fires next time.
  const [beat, setBeat] = useState(false);
  const wasActiveRef = useRef(active);
  useEffect(() => {
    if (active && !wasActiveRef.current) setBeat(true);
    wasActiveRef.current = active;
  }, [active]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={t('filterAria')}
      data-testid={testId || 'favorites-filter-toggle'}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors duration-150 min-h-11 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-focus-ring ${
        active
          ? 'border-transparent bg-accent-rose-soft text-accent-rose-ink shadow-card font-semibold'
          : 'border-accent-rose/40 bg-surface text-accent-rose-ink font-medium hover:bg-accent-rose-soft motion-safe:active:scale-95'
      }`}
    >
      <Heart
        className={`w-4 h-4 ${beat ? 'motion-safe:animate-heart-beat' : ''}`}
        fill={active ? 'currentColor' : 'none'}
        strokeWidth={active ? 0 : 2}
        onAnimationEnd={() => setBeat(false)}
      />
      {t('filterLabel')}
      {count > 0 && (
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
            active
              ? 'bg-surface text-accent-rose-ink'
              : 'bg-accent-rose-soft text-accent-rose-ink'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
