'use client';

import { useLocale } from 'next-intl';
import type { MergedPlaceList } from '@/lib/restaurant-map/schema';
import restaurantMapData from './data/restaurant-map.generated.json';
import { useRestaurantMapCatalog } from './useRestaurantMapCatalog';
import { RegionTabs } from './RegionTabs';
import { CategoryFilter } from './CategoryFilter';
import { PlaceSearch } from './PlaceSearch';
import { PlaceList } from './PlaceList';
import { PlaceDetailCard } from './PlaceDetailCard';
import { MapContainer } from './MapContainer';
import { GeolocationButton } from './GeolocationButton';
import { RestaurantMapIntro } from './RestaurantMapIntro';
import { RestaurantMapHowTo } from './RestaurantMapHowTo';
import { RestaurantMapFaq } from './RestaurantMapFaq';
import { RestaurantMapStructuredData } from './RestaurantMapStructuredData';

// Static catalog import: code-split within this dynamically-imported component
// (route wraps RestaurantMap in next/dynamic), so this JSON never enters the
// global i18n/shell bundle.
const DEFAULT_CATALOG = restaurantMapData as MergedPlaceList[];

export interface RestaurantMapProps {
  catalog?: MergedPlaceList[];
}

export function RestaurantMap({ catalog = DEFAULT_CATALOG }: RestaurantMapProps) {
  const locale = useLocale() as 'ko' | 'en';
  const hook = useRestaurantMapCatalog(catalog);
  const allPlaces = catalog.flatMap((list) => list[locale].places);
  const availableCategories = [...new Set(allPlaces.map((place) => place.category))];

  const emptyVariant =
    hook.activeRegion === 'favorites'
      ? ('noFavorites' as const)
      : hook.activeRegion === 'recent'
        ? ('noRecents' as const)
        : ('noMatches' as const);

  const resetFilters = () => {
    hook.setActiveRegion('all');
    hook.setActiveCategory('all');
    hook.setQuery('');
  };

  return (
    <div className="w-full">
      {/* SEO sections: SSR'd unconditionally so AI crawlers see them even before hydration/mount */}
      <RestaurantMapIntro />
      <RestaurantMapHowTo />
      <RestaurantMapFaq />
      <RestaurantMapStructuredData places={allPlaces} />

      {/* Interactive SPA content: gated on mount only (localStorage/geolocation dependent) */}
      {hook.mounted && (
        <main className="space-y-6 px-4 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <PlaceSearch query={hook.queryDraft} onQueryChange={hook.setQuery} resultCount={hook.resultCount} />
            <GeolocationButton requestGeolocation={hook.requestGeolocation} />
          </div>

          <div className="space-y-4">
            <RegionTabs
              activeRegion={hook.activeRegion}
              onRegionChange={hook.setActiveRegion}
              hasFavorites={hook.favorites.length > 0}
              hasRecents={hook.recents.length > 0}
              catalog={catalog}
            />

            <CategoryFilter
              activeCategory={hook.activeCategory}
              onCategoryChange={hook.setActiveCategory}
              availableCategories={availableCategories}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MapContainer
              places={hook.filteredPlaces}
              selectedPlaceId={hook.selectedPlaceId ?? undefined}
              userGeo={hook.userGeo}
              onMarkerClick={hook.select}
            />

            <PlaceList
              places={hook.filteredPlaces}
              selectedPlaceId={hook.selectedPlaceId}
              favorites={hook.favorites}
              onSelect={hook.select}
              onToggleFavorite={hook.toggleFavoriteFn}
              userGeo={hook.userGeo}
              emptyVariant={emptyVariant}
              onResetFilters={resetFilters}
            />
          </div>

          {hook.selectedPlace && (
            <PlaceDetailCard place={hook.selectedPlace} onClose={() => hook.select(null)} />
          )}
        </main>
      )}
    </div>
  );
}
