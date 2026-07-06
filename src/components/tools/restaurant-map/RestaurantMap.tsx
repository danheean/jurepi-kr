'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { MergedPlaceList } from '@/lib/restaurant-map/schema';
import { curators as getCurators } from '@/lib/restaurant-map/catalog';
import restaurantMapData from './data/restaurant-map.generated.json';
import { useRestaurantMapCatalog } from './useRestaurantMapCatalog';
import { RegionTabs } from './RegionTabs';
import { CategoryFilter } from './CategoryFilter';
import { CuratorFilter } from './CuratorFilter';
import { CuratorLegend } from './CuratorLegend';
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
  const t = useTranslations('tools.restaurant-map');
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
    hook.setActiveCurator('all');
    hook.setActiveCategory('all');
    hook.setQuery('');
  };

  return (
    <div className="w-full">
      {/* Intro (H1 + lead): SSR'd unconditionally */}
      <RestaurantMapIntro />

      {/* Curator legend (non-interactive identity strip) */}
      <div className="px-4 py-8 border-b border-hairline">
        <CuratorLegend />
      </div>

      {/* Interactive SPA content: gated on mount only (localStorage/geolocation dependent) */}
      {hook.mounted && (
        <main className="space-y-6 px-4 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <PlaceSearch query={hook.queryDraft} onQueryChange={hook.setQuery} resultCount={hook.resultCount} />
            <GeolocationButton
              requestGeolocation={hook.requestGeolocation}
              clearGeolocation={hook.clearGeolocation}
              geoStatus={hook.geoStatus}
            />
          </div>

          <div className="space-y-4">
            <CuratorFilter
              activeCurator={hook.activeCurator}
              onCuratorChange={hook.setActiveCurator}
              availableCurators={getCurators(catalog)}
            />

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

          {/* Left: single-column list · Right: larger map + selected detail below it.
              On mobile the map block shows first (order), list after. */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="order-2 lg:order-1 lg:w-[400px] lg:shrink-0">
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

            <div className="order-1 lg:order-2 min-w-0 flex-1 space-y-4 lg:sticky lg:top-4 lg:self-start">
              <MapContainer
                places={hook.filteredPlaces}
                selectedPlaceId={hook.selectedPlaceId ?? undefined}
                userGeo={hook.userGeo}
                onMarkerClick={hook.select}
                onBackgroundClick={() => hook.select(null)}
              />

              {hook.selectedPlace ? (
                <PlaceDetailCard place={hook.selectedPlace} onClose={() => hook.select(null)} />
              ) : (
                <p className="rounded-lg border border-hairline bg-surface-muted p-4 text-center text-sm text-text-secondary">
                  {t('placeDetail.selectHint')}
                </p>
              )}
            </div>
          </div>
        </main>
      )}

      {/* SEO long-form: moved below the tool (consistent with other tools),
          kept OUTSIDE the mount gate so AI crawlers see it in prerendered HTML */}
      <RestaurantMapHowTo />
      <RestaurantMapFaq />
      <RestaurantMapStructuredData places={allPlaces} />
    </div>
  );
}
