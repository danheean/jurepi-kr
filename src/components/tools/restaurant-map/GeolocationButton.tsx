'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, AlertCircle } from 'lucide-react';

/**
 * "내 위치" button that triggers geolocation permission.
 * Delegates actual geolocation state to useRestaurantMapCatalog (passed as requestGeolocation prop).
 * Does not call Geolocation API directly — state ownership is in the hook.
 */
export interface GeolocationButtonProps {
  requestGeolocation: () => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
}

export function GeolocationButton({
  requestGeolocation,
  disabled = false,
  isLoading = false,
}: GeolocationButtonProps) {
  const t = useTranslations('tools.restaurant-map');
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    try {
      await requestGeolocation();
    } catch (err) {
      // Friendly error message; actual error is handled in hook
      if (err instanceof Error) {
        setError('Location permission denied');
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-on-brand font-medium hover:opacity-90 disabled:opacity-50 transition"
        aria-label={t('buttons.myLocation')}
      >
        <MapPin className="w-4 h-4" />
        <span>{t('buttons.myLocation')}</span>
      </button>
      {error && (
        <div className="flex items-start gap-2 text-sm text-warning" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
