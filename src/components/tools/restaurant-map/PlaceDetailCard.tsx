'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Copy, ExternalLink } from 'lucide-react';
import type { Place } from '@/lib/restaurant-map/schema';

/**
 * Detailed place card panel.
 * Shows: name, category+region badge, address (with copy), description,
 * **personalNote callout** (distinct visual styling — curator's voice),
 * optional image, optional price range, optional external link.
 */
export interface PlaceDetailCardProps {
  place: Place | null;
  onClose: () => void;
}

export function PlaceDetailCard({ place, onClose }: PlaceDetailCardProps) {
  const t = useTranslations('tools.restaurant-map');

  // Close on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && place) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [place, onClose]);

  if (!place) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(place.address).catch(() => {
      // Fail silently
    });
  };

  return (
    <div className="fixed inset-0 z-40 md:static md:z-auto">
      {/* Overlay (mobile only) */}
      <div
        className="fixed inset-0 bg-black/20 md:hidden z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 md:static md:max-h-96 overflow-y-auto z-40 bg-surface rounded-t-3xl md:rounded-lg border-t md:border border-hairline p-6 shadow-card flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text mb-2">{place.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-surface-muted text-xs font-medium text-text-secondary">
                {place.category}
              </span>
              {place.priceRange && (
                <span className="px-2 py-1 rounded-full bg-surface-muted text-xs font-medium text-text-secondary">
                  {place.priceRange}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-muted rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Address with copy button */}
        <div className="flex items-start gap-2 p-3 bg-surface-muted rounded-lg">
          <div className="flex-1 text-sm text-text-secondary">{place.address}</div>
          <button
            onClick={handleCopyAddress}
            className="p-1 hover:bg-surface rounded transition flex-shrink-0"
            aria-label="Copy address"
            title="Copy address"
          >
            <Copy className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-text-secondary leading-relaxed">{place.description}</p>
        </div>

        {/* Personal Note Callout (curator's voice) */}
        <div className="border-l-4 border-brand pl-4 py-3 bg-brand/5 rounded-r">
          <h3 className="text-xs font-semibold text-brand uppercase tracking-wide mb-1">
            {t('personalNote.label')}
          </h3>
          <p className="text-sm text-text italic">{place.personalNote}</p>
        </div>

        {/* Image (if present) */}
        {place.imageUrl && place.imageWidth && place.imageHeight && (
          <img
            src={place.imageUrl}
            alt={place.name}
            width={place.imageWidth}
            height={place.imageHeight}
            loading="lazy"
            className="w-full rounded-lg object-cover max-h-48"
          />
        )}

        {/* External link */}
        {place.link && (
          <a
            href={place.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-brand text-on-brand rounded-lg font-medium hover:opacity-90 transition text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            {t('placeDetail.openInMaps')}
          </a>
        )}
      </div>
    </div>
  );
}
