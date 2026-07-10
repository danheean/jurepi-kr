import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RestaurantMap } from './RestaurantMap';
import { renderWithIntl } from './test-utils';
import type { MergedPlaceList, CuratorId } from '@/lib/restaurant-map/schema';

// Minimal test catalog
const createTestCatalog = (): MergedPlaceList[] => [
  {
    slug: 'test-list-1',
    region: 'seoul',
    curator: 'honey',
    city: 'Seoul',
    asOfDate: '2024-01-01',
    sourceUrl: 'https://example.com',
    ko: {
      title: '서울 카페',
      sourceNote: 'Test source',
      places: [
        {
          id: 'test-list-1#0',
          name: '카페 A',
          lat: 37.5,
          lng: 127.0,
          category: 'cafe',
          address: '서울시 강남구',
          description: 'Best cafe',
          personalNote: '분위기 좋음',
        },
        {
          id: 'test-list-1#1',
          name: '카페 B',
          lat: 37.6,
          lng: 127.1,
          category: 'cafe',
          address: '서울시 서초구',
          description: 'Cozy cafe',
          personalNote: '조용함',
        },
        {
          id: 'test-list-1#2',
          name: '카페 C',
          lat: 37.7,
          lng: 127.2,
          category: 'korean',
          address: '서울시 마포구',
          description: 'Traditional cafe',
          personalNote: '한옥',
        },
      ],
    },
    en: {
      title: 'Seoul Cafes',
      sourceNote: 'Test source',
      places: [
        {
          id: 'test-list-1#0',
          name: 'Cafe A',
          lat: 37.5,
          lng: 127.0,
          category: 'cafe',
          address: 'Gangnam, Seoul',
          description: 'Best cafe',
          personalNote: 'Great vibe',
        },
        {
          id: 'test-list-1#1',
          name: 'Cafe B',
          lat: 37.6,
          lng: 127.1,
          category: 'cafe',
          address: 'Seocho, Seoul',
          description: 'Cozy cafe',
          personalNote: 'Quiet',
        },
        {
          id: 'test-list-1#2',
          name: 'Cafe C',
          lat: 37.7,
          lng: 127.2,
          category: 'korean',
          address: 'Mapo, Seoul',
          description: 'Traditional cafe',
          personalNote: 'Hanok style',
        },
      ],
    },
  },
];

describe('RestaurantMap', () => {
  it('renders SEO sections (Intro/HowTo/Faq) unconditionally for AI crawlers', () => {
    const catalog = createTestCatalog();
    renderWithIntl(<RestaurantMap catalog={catalog} />);

    // SEO sections should be in DOM unconditionally
    // This is critical for AI crawlers that don't execute JS
    expect(screen.getByText('RESTAURANT TOOL')).toBeInTheDocument();
  });

  it('renders searchbox for interactive content', () => {
    const catalog = createTestCatalog();
    renderWithIntl(<RestaurantMap catalog={catalog} />);

    // After mount, search input should exist
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('mounts successfully with empty catalog', () => {
    renderWithIntl(<RestaurantMap catalog={[]} />);

    // Should not crash, SEO sections render anyway
    expect(screen.getByText('RESTAURANT TOOL')).toBeInTheDocument();
  });

  it('derives region filters from the catalog (busan appears when a busan list exists)', () => {
    // Regression: RestaurantMap did not pass `catalog` to RegionTabs, so the
    // region filter fell back to a hardcoded all/seoul/nationwide set and the
    // busan filter silently disappeared even though busan places were rendered.
    const seoulList = createTestCatalog()[0];
    const busanList: MergedPlaceList = {
      ...seoulList,
      slug: 'test-busan',
      region: 'busan',
      ko: { ...seoulList.ko, title: '부산 리스트' },
      en: { ...seoulList.en, title: 'Busan list' },
    };
    renderWithIntl(<RestaurantMap catalog={[seoulList, busanList]} />);

    // Region filters are a toggle-button group (role=group + aria-pressed).
    const regionGroup = screen.getByRole('group', { name: /region/i });
    const regionNames = within(regionGroup)
      .getAllByRole('button')
      .map((el) => el.textContent);
    expect(regionNames).toContain('Busan');
  });

  it('renders only category filters that exist in the catalog (no dead 기타 filter)', () => {
    // Test catalog has cafe + korean only — buttons for absent categories
    // (일식/기타 …) must not render, so users can never reach a guaranteed-empty
    // filter that looks like an error.
    const catalog = createTestCatalog();
    renderWithIntl(<RestaurantMap catalog={catalog} />, { locale: 'ko' });

    expect(screen.getByRole('button', { name: '카페' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '한식' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '기타' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '일식' })).not.toBeInTheDocument();
  });

  it('renders place list region with semantic role', () => {
    const catalog = createTestCatalog();
    const { container } = renderWithIntl(<RestaurantMap catalog={catalog} />);

    // Place list should have proper semantic markup
    const placeList = container.querySelector('#place-list');
    expect(placeList).toHaveAttribute('role', 'region');
  });

  it('narrows the place list to the selected curator', async () => {
    // Behavioral lock for the hook curator filter: places carry a denormalized
    // curator; clicking a curator pill must remove the other curators' places.
    const base = createTestCatalog()[0];
    const withCurator = (
      curator: CuratorId,
      slug: string,
      label: string
    ): MergedPlaceList => ({
      ...base,
      slug,
      curator,
      ko: {
        ...base.ko,
        title: label,
        places: base.ko.places.map((p, i) => ({
          ...p,
          id: `${slug}#${i}`,
          curator,
          name: `${label}${i}`,
        })),
      },
      en: {
        ...base.en,
        title: label,
        places: base.en.places.map((p, i) => ({
          ...p,
          id: `${slug}#${i}`,
          curator,
          name: `${label}${i}`,
        })),
      },
    });
    const honeyList = withCurator('honey', 'honey-list', 'HoneyPlace');
    const nuclearList = withCurator('nuclear', 'nuclear-list', 'NuclearPlace');
    const user = userEvent.setup();
    renderWithIntl(<RestaurantMap catalog={[honeyList, nuclearList]} />);

    // Both curators' places visible under the default "all" filter
    expect(screen.getAllByText(/HoneyPlace/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/NuclearPlace/).length).toBeGreaterThan(0);

    // Click the Nuclear curator pill (curator filter is the topmost filter).
    // Exact name so place-card buttons ("NuclearPlace0") don't match.
    await user.click(screen.getByRole('button', { name: 'Nuclear' }));

    expect(screen.queryByText(/HoneyPlace/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/NuclearPlace/).length).toBeGreaterThan(0);
  });
});
