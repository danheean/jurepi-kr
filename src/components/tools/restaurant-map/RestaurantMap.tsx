'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { MergedPlaceList } from '@/lib/restaurant-map/schema';
import { useRestaurantMapCatalog } from './useRestaurantMapCatalog';
import { RegionTabs } from './RegionTabs';
import { CategoryFilter } from './CategoryFilter';
import { PlaceSearch } from './PlaceSearch';
import { PlaceList } from './PlaceList';
import { RestaurantMapIntro } from './RestaurantMapIntro';
import { RestaurantMapHowTo } from './RestaurantMapHowTo';
import { RestaurantMapFaq } from './RestaurantMapFaq';

export interface RestaurantMapProps {
  catalog: MergedPlaceList[];
}

export function RestaurantMap({ catalog }: RestaurantMapProps) {
  const locale = useLocale();
  const t = useTranslations('tools.restaurant-map');
  const [mapSDKReady, setMapSDKReady] = useState(false);
  const hook = useRestaurantMapCatalog(catalog);

  useEffect(() => {
    // Map SDK is loaded asynchronously; for now, mark as ready for list-only fallback
    setMapSDKReady(true);
  }, []);

  if (!hook.mounted) {
    return null;
  }

  return (
    <div className="w-full">
      {/* SEO sections: rendered outside mounted gate for AI crawlers */}
      <RestaurantMapIntro />
      <RestaurantMapHowTo />
      <RestaurantMapFaq />

      {/* Interactive SPA content */}
      <main className="space-y-6 px-4 py-8">
        <PlaceSearch query={hook.query} onQueryChange={hook.setQuery} resultCount={hook.resultCount} />

        <div className="space-y-4">
          <RegionTabs
            activeRegion={hook.activeRegion}
            onRegionChange={hook.setActiveRegion}
            hasFavorites={hook.favorites.length > 0}
            hasRecents={hook.recents.length > 0}
          />

          <CategoryFilter
            activeCategory={hook.activeCategory}
            onCategoryChange={hook.setActiveCategory}
          />
        </div>

        <PlaceList
          places={hook.filteredPlaces}
          selectedPlaceId={hook.selectedPlaceId}
          favorites={hook.favorites}
          onSelect={hook.select}
          onToggleFavorite={hook.toggleFavoriteFn}
          userGeo={hook.userGeo}
          onRequestGeolocation={hook.requestGeolocation}
          onClearGeolocation={hook.clearGeolocation}
        />
      </main>
    </div>
  );
}
