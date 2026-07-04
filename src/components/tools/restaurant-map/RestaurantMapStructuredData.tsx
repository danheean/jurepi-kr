'use client';

import { useLocale, useTranslations } from 'next-intl';
import { softwareApplicationJsonLd, absoluteToolUrl } from '@/lib/seo';
import type { Place } from '@/lib/restaurant-map/schema';

/**
 * Structured data component for Restaurant List tool.
 * Emits:
 * 1. SoftwareApplication JSON-LD (tool identity)
 * 2. FoodEstablishment/Restaurant JSON-LD per place (for Maps/GEO indexing)
 * 3. ItemList JSON-LD grouping places by list
 *
 * FAQPage JSON-LD is owned by RestaurantMapFaq (single owner pattern).
 * Rendered outside mounted gate for full prerender (crawlable).
 */
export interface RestaurantMapStructuredDataProps {
  places: Place[];
  listSlug?: string;
}

export function RestaurantMapStructuredData({
  places,
  listSlug,
}: RestaurantMapStructuredDataProps) {
  const locale = useLocale() as 'ko' | 'en';
  const t = useTranslations('tools.restaurant-map');

  const toolUrl = absoluteToolUrl(locale, 'restaurant-map');
  const title = t('meta.title');
  const description = t('meta.description');

  const softwareApp = softwareApplicationJsonLd({
    name: title,
    description,
    url: toolUrl,
  });

  // FoodEstablishment JSON-LD for each place
  const placeJsonLds = places.map((place) => ({
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: place.name,
    description: place.description,
    url: place.link || toolUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    },
  }));

  // ItemList JSON-LD grouping places
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${title} (${listSlug || 'all'})`,
    description,
    itemListElement: places.map((place, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: place.name,
      description: place.description,
      url: `${toolUrl}#${place.id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      {placeJsonLds.map((placeJsonLd, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
