'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

/**
 * Fallback UI shown when NAVER Maps SDK fails to load.
 * User can still browse the restaurant list without the map.
 */
export function MapFailover() {
  const t = useTranslations('tools.restaurant-map');

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-6 bg-surface-muted rounded-lg border border-hairline"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-8 h-8 text-warning" />
      <p className="text-center text-sm text-text-secondary max-w-xs">
        {t('mapFailover.message')}
      </p>
    </div>
  );
}
