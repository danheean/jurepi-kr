import { useTranslations } from 'next-intl';
import { CURATOR_ORDER, avatarSrc, CURATORS } from '@/lib/restaurant-map/curators';

export interface CuratorFilterProps {
  activeCurator: string;
  onCuratorChange: (curator: string) => void;
  /**
   * Curator ids present in the catalog. When provided, only these (plus
   * 'all') are rendered — a hardcoded full list exposes dead filters.
   */
  availableCurators?: string[];
}

export function CuratorFilter({
  activeCurator,
  onCuratorChange,
  availableCurators,
}: CuratorFilterProps) {
  const t = useTranslations('tools.restaurant-map');

  const visibleCurators = CURATOR_ORDER.filter(
    (curator) =>
      curator === 'all' || !availableCurators || availableCurators.includes(curator)
  );

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t('curatorLabel')}
      >
        {visibleCurators.map((curator) => {
          const isActive = activeCurator === curator;
          const label =
            curator === 'all'
              ? t('curators.all')
              : t(`curators.${curator}`);

          return (
            <button
              key={curator}
              onClick={() => onCuratorChange(curator)}
              aria-pressed={isActive}
              className={`flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
              }`}
            >
              {curator !== 'all' && (
                <img
                  src={avatarSrc(curator as any)}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                  width={20}
                  height={20}
                  loading="lazy"
                />
              )}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
