import { useTranslations } from 'next-intl';
import { Star, ExternalLink, Quote } from 'lucide-react';
import { haversineDistance } from '@/lib/restaurant-map/geo';
import type { Place } from '@/lib/restaurant-map/schema';

export interface PlaceCardProps {
  place: Place;
  isSelected: boolean;
  isFavorited: boolean;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  userGeo?: { lat: number; lng: number } | null;
  isInFavoritesTab?: boolean;
}

export function PlaceCard({
  place,
  isSelected,
  isFavorited,
  onSelect,
  onToggleFavorite,
  userGeo,
}: PlaceCardProps) {
  const t = useTranslations('tools.restaurant-map');

  const distance = userGeo
    ? haversineDistance(userGeo.lat, userGeo.lng, place.lat, place.lng)
    : null;

  const categoryLabel = t(`categories.${place.category}`);

  return (
    <article
      data-testid={`place-card-${place.id}`}
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border bg-surface p-4 transition-all ${
        isSelected
          ? 'border-accent-rose ring-2 ring-accent-rose'
          : 'border-hairline hover:-translate-y-0.5 hover:shadow-card'
      }`}
      role="button"
      tabIndex={0}
    >
      <div className="space-y-2">
        {/* Header: name + favorite star */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-base font-semibold text-text">{place.name}</h3>
          <button
            onClick={onToggleFavorite}
            className="shrink-0 rounded p-1 hover:bg-surface-muted"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorited}
          >
            <Star
              className={`h-5 w-5 ${isFavorited ? 'fill-accent-rose text-accent-rose' : 'text-text-secondary'}`}
            />
          </button>
        </div>

        {/* Category badge + region + distance */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-text-secondary">
            {categoryLabel}
          </span>
          {distance !== null && (
            <span className="text-xs text-text-secondary">
              {distance.toFixed(1)}
              {t('distance.unit')}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary line-clamp-2">{place.description}</p>

        {/* Personal note quote */}
        <div className="flex gap-2 rounded-lg bg-surface-muted p-3">
          <Quote className="h-4 w-4 shrink-0 text-text-secondary opacity-50" />
          <div className="text-sm italic text-text-secondary line-clamp-2">
            {place.personalNote}
          </div>
        </div>

        {/* Address + link */}
        <div className="flex items-center justify-between gap-2">
          <address className="flex-1 text-xs text-text-muted not-italic line-clamp-1">
            {place.address}
          </address>
          {place.link && (
            <a
              href={place.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 rounded p-1 text-text-secondary hover:bg-surface-muted hover:text-text"
              aria-label="Open in external map"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
