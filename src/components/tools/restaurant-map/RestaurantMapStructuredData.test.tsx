import { describe, it, expect } from 'vitest';
import { RestaurantMapStructuredData } from './RestaurantMapStructuredData';
import { renderWithIntl } from './test-utils';
import type { Place } from '@/lib/restaurant-map/schema';

const testPlaces: Place[] = [
  {
    id: 'seoul-jokbal#0',
    name: 'Jangchung-dong Original Jokbal',
    lat: 37.5605,
    lng: 127.0089,
    category: 'korean',
    address: '174 Jangchungdan-ro, Jung-gu, Seoul',
    description: 'Serving jokbal since the 1970s.',
    personalNote: "Budget time for the line.",
    link: 'https://map.naver.com/p/entry/place/11592234',
  },
  {
    id: 'seoul-jokbal#1',
    name: 'Itaewon Front-Leg Jokbal',
    lat: 37.5347,
    lng: 126.9946,
    category: 'korean',
    address: '220 Itaewon-ro, Yongsan-gu, Seoul',
    description: 'Leaner, less fatty jokbal.',
    personalNote: 'My go-to.',
  },
];

function getJsonLdScripts(container: HTMLElement): Record<string, unknown>[] {
  return Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(
    (el) => JSON.parse(el.innerHTML)
  );
}

describe('RestaurantMapStructuredData', () => {
  it('emits exactly one SoftwareApplication JSON-LD', () => {
    const { container } = renderWithIntl(
      <RestaurantMapStructuredData places={testPlaces} />
    );
    const schemas = getJsonLdScripts(container);
    const softwareApps = schemas.filter((s) => s['@type'] === 'SoftwareApplication');
    expect(softwareApps).toHaveLength(1);
    expect(softwareApps[0].url).toMatch(/restaurant-map$/);
  });

  it('emits one FoodEstablishment JSON-LD per place with valid geo/address', () => {
    const { container } = renderWithIntl(
      <RestaurantMapStructuredData places={testPlaces} />
    );
    const schemas = getJsonLdScripts(container);
    const foodEstablishments = schemas.filter((s) => s['@type'] === 'FoodEstablishment');
    expect(foodEstablishments).toHaveLength(testPlaces.length);

    const first = foodEstablishments[0] as any;
    expect(first.name).toBe('Jangchung-dong Original Jokbal');
    expect(first.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 37.5605,
      longitude: 127.0089,
    });
    expect(first.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '174 Jangchungdan-ro, Jung-gu, Seoul',
    });
    expect(first.url).toBe('https://map.naver.com/p/entry/place/11592234');
  });

  it('falls back to the tool URL when a place has no external link', () => {
    const { container } = renderWithIntl(
      <RestaurantMapStructuredData places={[testPlaces[1]]} />
    );
    const schemas = getJsonLdScripts(container);
    const foodEstablishment = schemas.find((s) => s['@type'] === 'FoodEstablishment') as any;
    expect(foodEstablishment.url).toMatch(/restaurant-map$/);
  });

  it('emits exactly one ItemList JSON-LD covering every place', () => {
    const { container } = renderWithIntl(
      <RestaurantMapStructuredData places={testPlaces} />
    );
    const schemas = getJsonLdScripts(container);
    const itemLists = schemas.filter((s) => s['@type'] === 'ItemList');
    expect(itemLists).toHaveLength(1);

    const itemList = itemLists[0] as any;
    expect(itemList.itemListElement).toHaveLength(testPlaces.length);
    expect(itemList.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'Jangchung-dong Original Jokbal',
    });
  });

  it('does not emit a FAQPage schema (owned exclusively by RestaurantMapFaq)', () => {
    const { container } = renderWithIntl(
      <RestaurantMapStructuredData places={testPlaces} />
    );
    const schemas = getJsonLdScripts(container);
    expect(schemas.some((s) => s['@type'] === 'FAQPage')).toBe(false);
  });

  it('renders no place schemas when places array is empty', () => {
    const { container } = renderWithIntl(<RestaurantMapStructuredData places={[]} />);
    const schemas = getJsonLdScripts(container);
    expect(schemas.filter((s) => s['@type'] === 'FoodEstablishment')).toHaveLength(0);
    expect(schemas.filter((s) => s['@type'] === 'SoftwareApplication')).toHaveLength(1);
  });
});
