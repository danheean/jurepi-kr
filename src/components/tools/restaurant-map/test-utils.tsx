import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const defaultMessages: any = {
  tools: {
    'restaurant-map': {
      title: 'Restaurant List',
      description: 'Discover curated places to eat',
      meta: {
        title: 'Restaurant List',
        description: 'Discover curated places to eat',
      },
      intro: {
        eyebrow: 'RESTAURANT TOOL',
        lead: 'Explore curated dining spots.',
      },
      regions: {
        all: 'All',
        seoul: 'Seoul',
        busan: 'Busan',
        daegu: 'Daegu',
        daejeon: 'Daejeon',
        gwangju: 'Gwangju',
        ulsan: 'Ulsan',
        gyeonggi: 'Gyeonggi',
        gangwon: 'Gangwon',
        chungbuk: 'Chungbuk',
        chungnam: 'Chungnam',
        jeonbuk: 'Jeonbuk',
        jeonnam: 'Jeonnam',
        gyeongbuk: 'Gyeongbuk',
        gyeongnam: 'Gyeongnam',
        jeju: 'Jeju',
        nationwide: 'Nationwide',
        favorites: 'Favorites',
        recent: 'Recent',
      },
      categories: {
        all: 'All Categories',
        cafe: 'Café',
        korean: 'Korean',
        japanese: 'Japanese',
        chinese: 'Chinese',
        brunch: 'Brunch',
        bar: 'Bar',
        dessert: 'Dessert',
        other: 'Other',
      },
      search: {
        label: 'Search',
        placeholder: 'Search by name or cuisine…',
        resultCount: '{count} results',
      },
      buttons: {
        myLocation: 'My Location',
        clearSearch: 'Clear',
      },
      geolocation: {
        denied: 'Location access denied',
        error: 'Unable to get location',
        loading: 'Getting location…',
        granted: 'Location enabled',
      },
      personalNote: {
        label: 'Personal Take',
      },
      distance: {
        unit: 'km',
        away: ' away',
      },
      empty: {
        noResults: 'No restaurants found',
        noFavorites: 'No favorites yet',
      },
      mapToggle: {
        mapView: 'Map',
        listView: 'List',
      },
      sourceNote: {
        label: 'Source',
      },
      asOfDate: {
        label: 'As of',
      },
      faq: {
        heading: 'Frequently Asked Questions',
        items: [
          { q: 'How often is the list updated?', a: 'Each list shows its publication date.' },
          { q: 'What does Personal Take mean?', a: "The curator's first-hand opinion." },
        ],
      },
    },
  },
};

interface IntlProviderProps {
  children: ReactNode;
  locale?: string;
}

export function IntlProvider({ children, locale = 'en' }: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={defaultMessages}>
      {children}
    </NextIntlClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string;
}

export function renderWithIntl(ui: ReactNode, { locale = 'en', ...options }: CustomRenderOptions = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <IntlProvider locale={locale}>
        {children}
      </IntlProvider>
    ),
    ...options,
  });
}

export * from '@testing-library/react';
