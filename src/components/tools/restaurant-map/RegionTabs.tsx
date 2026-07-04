import { useTranslations } from 'next-intl';
import { regions as getRegions } from '@/lib/restaurant-map/catalog';
import type { MergedPlaceList } from '@/lib/restaurant-map/schema';

const REGION_ORDER = [
  'all',
  'seoul',
  'busan',
  'daegu',
  'daejeon',
  'gwangju',
  'ulsan',
  'gyeonggi',
  'gangwon',
  'chungbuk',
  'chungnam',
  'jeonbuk',
  'jeonnam',
  'gyeongbuk',
  'gyeongnam',
  'jeju',
  'nationwide',
];

export interface RegionTabsProps {
  activeRegion: string;
  onRegionChange: (region: string) => void;
  hasFavorites: boolean;
  hasRecents: boolean;
  catalog?: MergedPlaceList[];
}

export function RegionTabs({
  activeRegion,
  onRegionChange,
  hasFavorites,
  hasRecents,
  catalog,
}: RegionTabsProps) {
  const t = useTranslations('tools.restaurant-map');

  const regionList: string[] = [];
  if (catalog) {
    const liveRegions = getRegions(catalog);
    regionList.push('all');
    for (const region of REGION_ORDER) {
      if (region !== 'all' && region !== 'nationwide' && liveRegions.includes(region)) {
        regionList.push(region);
      }
    }
    if (liveRegions.includes('nationwide')) {
      regionList.push('nationwide');
    }
  } else {
    regionList.push('all');
    regionList.push('seoul');
    regionList.push('nationwide');
  }

  if (hasFavorites) regionList.push('favorites');
  if (hasRecents) regionList.push('recent');

  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {regionList.map((region) => {
        const isActive = activeRegion === region;
        const label =
          region === 'all'
            ? t('regions.all')
            : region === 'favorites'
              ? t('regions.favorites')
              : region === 'recent'
                ? t('regions.recent')
                : t(`regions.${region}`);

        return (
          <button
            key={region}
            role="tab"
            aria-selected={isActive}
            onClick={() => onRegionChange(region)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand text-on-brand'
                : 'bg-surface-muted text-text-secondary hover:bg-surface-sunken'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
