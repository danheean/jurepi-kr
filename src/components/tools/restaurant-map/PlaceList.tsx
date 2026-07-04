import { useEffect, useRef, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Roving tabindex keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      const items = Array.from(itemRefs.current.values());
      const currentIndex = items.findIndex((el) => el === document.activeElement);

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            items[currentIndex - 1]?.focus();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < items.length - 1) {
            items[currentIndex + 1]?.focus();
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentIndex >= 0) {
            const placeId = places[currentIndex]?.id;
            if (placeId) onSelect(placeId);
          }
          break;
        case 'f':
          if (currentIndex >= 0) {
            const placeId = places[currentIndex]?.id;
            if (placeId) onToggleFavorite(placeId);
          }
          break;
        case 'Escape':
          onSelect(null);
          break;
        default:
          break;
      }
    };

    containerRef.current?.addEventListener('keydown', handleKeyDown);
    return () => containerRef.current?.removeEventListener('keydown', handleKeyDown);
  }, [places, onSelect, onToggleFavorite]);

  const handleSelectPlace = useCallback(
    (placeId: string) => {
      onSelect(placeId);
      // Scroll selected card into view
      const card = itemRefs.current.get(placeId);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      ref={containerRef}
      id="place-list"
      className="grid grid-cols-1 gap-3"
      role="region"
      aria-label={t('title')}
    >
      {places.map((place, index) => {
        const placeId = place.id || '';
        return (
          <div
            key={placeId}
            ref={(el) => {
              if (el && placeId) itemRefs.current.set(placeId, el);
              else if (placeId) itemRefs.current.delete(placeId);
            }}
            tabIndex={index === 0 ? 0 : -1}
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
