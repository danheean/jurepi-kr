'use client';

import { useTranslations } from 'next-intl';
import { MapPin, LocateFixed, Loader2, AlertCircle } from 'lucide-react';
import type { GeoStatus } from './useRestaurantMapCatalog';

/**
 * "내 위치" toggle that triggers geolocation permission.
 * Delegates geolocation state to useRestaurantMapCatalog: the hook's request
 * promise never rejects — outcome (loading/active/denied/error/unsupported)
 * arrives via the geoStatus prop, and all user-facing copy is i18n.
 */
export interface GeolocationButtonProps {
  requestGeolocation: () => Promise<void>;
  clearGeolocation?: () => void;
  geoStatus?: GeoStatus;
  disabled?: boolean;
  isLoading?: boolean;
}

const FAILURE_MESSAGE_KEY: Partial<Record<GeoStatus, string>> = {
  denied: 'geolocation.denied',
  error: 'geolocation.error',
  unsupported: 'geolocation.unsupported',
};

export function GeolocationButton({
  requestGeolocation,
  clearGeolocation,
  geoStatus = 'idle',
  disabled = false,
  isLoading = false,
}: GeolocationButtonProps) {
  const t = useTranslations('tools.restaurant-map');

  const loading = isLoading || geoStatus === 'loading';
  const active = geoStatus === 'active';
  const failureKey = FAILURE_MESSAGE_KEY[geoStatus];

  const label = active
    ? t('buttons.clearLocation')
    : loading
      ? t('geolocation.loading')
      : t('buttons.myLocation');

  const handleClick = () => {
    if (active) {
      clearGeolocation?.();
      return;
    }
    void requestGeolocation();
  };

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        aria-pressed={active}
        aria-label={label}
        className={`flex items-center justify-center gap-2 whitespace-nowrap shrink-0 px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition ${
          active
            ? 'bg-surface-muted text-text-secondary border border-hairline hover:bg-surface-sunken'
            : 'bg-brand text-on-brand'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : active ? (
          <LocateFixed className="w-4 h-4" aria-hidden />
        ) : (
          <MapPin className="w-4 h-4" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      {failureKey && (
        <p className="flex items-start gap-2 text-sm text-warning" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
          <span>{t(failureKey)}</span>
        </p>
      )}
    </div>
  );
}
