import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Place } from '@/lib/restaurant-map/schema';
import { PlaceCard } from './PlaceCard';
import { PlaceListEmpty, type PlaceListEmptyVariant } from './PlaceListEmpty';

export interface PlaceListProps {
  places: Place[];
  selectedPlaceId: string | null;
  favorites: string[];
  onSelect: (placeId: string | null) => void;
  onToggleFavorite: (placeId: string) => void;
  userGeo?: { lat: number; lng: number } | null;
  emptyVariant: PlaceListEmptyVariant;
  onResetFilters: () => void;
}

export function PlaceList({
  places,
  selectedPlaceId,
  favorites,
  onSelect,
  onToggleFavorite,
  userGeo,
  emptyVariant,
  onResetFilters,
}: PlaceListProps) {
  const t = useTranslations('tools.restaurant-map');
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Each card exposes its own focusable controls (an overlay "view details"
  // button + favorite + external link), so keyboard users get natural Tab
  // order. No custom roving-tabindex: a hand-rolled arrow-key handler was
  // doubling focus stops (wrapper div + card) and never matched a real listbox
  // widget contract.

  const handleSelectPlace = useCallback(
    (placeId: string) => {
      onSelect(placeId);
      // Scroll selected card into view (respect reduced-motion)
      const card = itemRefs.current.get(placeId);
      if (card) {
        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        card.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
      }
    },
    [onSelect]
  );

  const handleToggleFavorite = useCallback(
    (placeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(placeId);
    },
    [onToggleFavorite]
  );

  if (places.length === 0) {
    return <PlaceListEmpty variant={emptyVariant} onResetFilters={onResetFilters} />;
  }

  return (
    <div
      id="place-list"
      className="grid grid-cols-1 gap-3"
      role="region"
      aria-label={t('title')}
    >
      {places.map((place) => {
        const placeId = place.id || '';
        return (
          <div
            key={placeId}
            ref={(el) => {
              if (el && placeId) itemRefs.current.set(placeId, el);
              else if (placeId) itemRefs.current.delete(placeId);
            }}
          >
            <PlaceCard
              place={place}
              isSelected={selectedPlaceId === placeId}
              isFavorited={favorites.includes(placeId)}
              onSelect={() => handleSelectPlace(placeId)}
              onToggleFavorite={(e) => handleToggleFavorite(placeId, e)}
              userGeo={userGeo}
            />
          </div>
        );
      })}
    </div>
  );
}
