import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';

export interface PlaceListEmptyProps {
  onRequestGeolocation: () => Promise<void>;
  onClearGeolocation: () => void;
  hasUserGeo: boolean;
}

export function PlaceListEmpty({
  onRequestGeolocation,
  onClearGeolocation,
  hasUserGeo,
}: PlaceListEmptyProps) {
  const t = useTranslations('tools.restaurant-map');

  if (hasUserGeo) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-surface-muted p-6 text-center">
        <div className="text-5xl">🔍</div>
        <h3 className="text-lg font-semibold text-text">{t('empty.noResults')}</h3>
        <button
          onClick={onClearGeolocation}
          className="rounded-lg bg-brand px-4 py-2 text-on-brand transition-colors hover:bg-brand-strong"
        >
          {t('buttons.clearSearch')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-surface-muted p-6 text-center">
      <MapPin className="h-12 w-12 text-text-secondary opacity-50" />
      <h3 className="text-lg font-semibold text-text">{t('empty.noFavorites')}</h3>
      <p className="text-sm text-text-secondary">{t('buttons.myLocation')}</p>
      <button
        onClick={onRequestGeolocation}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-on-brand transition-colors hover:bg-brand-strong"
      >
        <MapPin className="h-4 w-4" />
        {t('buttons.myLocation')}
      </button>
    </div>
  );
}
