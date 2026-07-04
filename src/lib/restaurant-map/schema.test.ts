import { describe, it, expect } from 'vitest';
import {
  PlaceFileFrontSchema,
  PlaceListFileFrontSchema,
  PlaceSchema,
  MergedPlaceListSchema,
  RestaurantMapStoreSchema,
  STORE_VERSION,
  REGION_ENUM,
  CATEGORY_ENUM,
} from './schema';

describe('schema', () => {
  describe('PlaceSchema', () => {
    it('parses valid place with all fields', () => {
      const place = {
        name: 'Test Cafe',
        lat: 37.5,
        lng: 127.0,
        category: 'cafe',
        address: '123 Main St',
        description: 'A nice cafe',
        personalNote: 'Great coffee!',
        link: 'https://example.com',
        priceRange: '₩5,000–10,000',
        imageUrl: 'https://example.com/image.jpg',
        imageWidth: 300,
        imageHeight: 200,
      };
      const result = PlaceSchema.parse(place);
      expect(result.name).toBe('Test Cafe');
      expect(result.personalNote).toBe('Great coffee!');
    });

    it('rejects place with missing personalNote', () => {
      const place = {
        name: 'Test Cafe',
        lat: 37.5,
        lng: 127.0,
        category: 'cafe',
        address: '123 Main St',
        description: 'A nice cafe',
        // personalNote missing
      };
      expect(() => PlaceSchema.parse(place)).toThrow();
    });

    it('rejects place with empty personalNote', () => {
      const place = {
        name: 'Test Cafe',
        lat: 37.5,
        lng: 127.0,
        category: 'cafe',
        address: '123 Main St',
        description: 'A nice cafe',
        personalNote: '',
      };
      expect(() => PlaceSchema.parse(place)).toThrow();
    });

    it('rejects place with whitespace-only personalNote', () => {
      const place = {
        name: 'Test Cafe',
        lat: 37.5,
        lng: 127.0,
        category: 'cafe',
        address: '123 Main St',
        description: 'A nice cafe',
        personalNote: '   ',
      };
      expect(() => PlaceSchema.parse(place)).toThrow();
    });

    it('rejects place with invalid coordinates', () => {
      const place = {
        name: 'Test Cafe',
        lat: 50, // outside Korea bounds 33-39
        lng: 127.0,
        category: 'cafe',
        address: '123 Main St',
        description: 'A nice cafe',
        personalNote: 'Great coffee!',
      };
      expect(() => PlaceSchema.parse(place)).toThrow();
    });

    it('allows optional fields', () => {
      const place = {
        name: 'Test Cafe',
        lat: 37.5,
        lng: 127.0,
        category: 'cafe',
        address: '123 Main St',
        description: 'A nice cafe',
        personalNote: 'Great!',
      };
      const result = PlaceSchema.parse(place);
      expect(result.link).toBeUndefined();
      expect(result.priceRange).toBeUndefined();
    });
  });

  describe('PlaceListFileFrontSchema', () => {
    it('parses valid place list frontmatter', () => {
      const front = {
        title: 'Seongsu Cafes',
        region: 'seoul',
        asOfDate: '2026-07-04',
        sourceNote: 'Personal visits',
        places: [
          {
            name: 'Cafe 1',
            lat: 37.5445,
            lng: 127.0557,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          {
            name: 'Cafe 2',
            lat: 37.5446,
            lng: 127.0558,
            category: 'cafe',
            address: 'Address 2',
            description: 'Desc 2',
            personalNote: 'Note 2',
          },
          {
            name: 'Cafe 3',
            lat: 37.5447,
            lng: 127.0559,
            category: 'cafe',
            address: 'Address 3',
            description: 'Desc 3',
            personalNote: 'Note 3',
          },
        ],
      };
      const result = PlaceListFileFrontSchema.parse(front);
      expect(result.title).toBe('Seongsu Cafes');
      expect(result.region).toBe('seoul');
      expect(result.places).toHaveLength(3);
    });

    it('accepts nationwide region for multi-city food themes', () => {
      const front = {
        title: 'National Tuna Spots',
        region: 'nationwide',
        asOfDate: '2026-07-04',
        sourceNote: 'Tuna across Korea',
        places: [
          {
            name: 'Tuna 1',
            lat: 37.5,
            lng: 127.0,
            category: 'japanese',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          {
            name: 'Tuna 2',
            lat: 35.1,
            lng: 129.0,
            category: 'japanese',
            address: 'Address 2',
            description: 'Desc 2',
            personalNote: 'Note 2',
          },
          {
            name: 'Tuna 3',
            lat: 37.3,
            lng: 127.1,
            category: 'japanese',
            address: 'Address 3',
            description: 'Desc 3',
            personalNote: 'Note 3',
          },
        ],
      };
      const result = PlaceListFileFrontSchema.parse(front);
      expect(result.region).toBe('nationwide');
    });

    it('rejects fewer than 3 places', () => {
      const front = {
        title: 'Few Cafes',
        region: 'seoul',
        asOfDate: '2026-07-04',
        sourceNote: 'Personal visits',
        places: [
          {
            name: 'Cafe 1',
            lat: 37.5445,
            lng: 127.0557,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          {
            name: 'Cafe 2',
            lat: 37.5446,
            lng: 127.0558,
            category: 'cafe',
            address: 'Address 2',
            description: 'Desc 2',
            personalNote: 'Note 2',
          },
        ],
      };
      expect(() => PlaceListFileFrontSchema.parse(front)).toThrow();
    });

    it('rejects missing sourceNote', () => {
      const front = {
        title: 'Cafes',
        region: 'seoul',
        asOfDate: '2026-07-04',
        // sourceNote missing
        places: [
          {
            name: 'Cafe 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
          {
            name: 'Cafe 2',
            lat: 37.6,
            lng: 127.1,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
          {
            name: 'Cafe 3',
            lat: 37.7,
            lng: 127.2,
            category: 'cafe',
            address: 'Address',
            description: 'Desc',
            personalNote: 'Note',
          },
        ],
      };
      expect(() => PlaceListFileFrontSchema.parse(front)).toThrow();
    });
  });

  describe('RestaurantMapStoreSchema', () => {
    it('parses valid store with favorites and recents', () => {
      const store = {
        version: 1,
        favorites: ['seoul-jokbal#0', 'seoul-jokbal#1'],
        recents: ['seoul-jokbal#2', 'seoul-jokbal#1'],
        userGeo: { lat: 37.5, lng: 127.0, timestamp: Date.now() },
        meta: { lastRegion: 'seoul', createdAt: Date.now() },
      };
      const result = RestaurantMapStoreSchema.parse(store);
      expect(result.favorites).toHaveLength(2);
      expect(result.recents).toHaveLength(2);
    });

    it('parses store with empty arrays', () => {
      const store = {
        version: 1,
        favorites: [],
        recents: [],
        meta: { createdAt: Date.now() },
      };
      const result = RestaurantMapStoreSchema.parse(store);
      expect(result.version).toBe(STORE_VERSION);
    });
  });

  describe('REGION_ENUM', () => {
    it('includes nationwide', () => {
      expect(REGION_ENUM).toContain('nationwide');
    });

    it('includes all Korean regions', () => {
      expect(REGION_ENUM).toContain('seoul');
      expect(REGION_ENUM).toContain('busan');
      expect(REGION_ENUM).toContain('daegu');
    });
  });

  describe('CATEGORY_ENUM', () => {
    it('includes all expected categories', () => {
      expect(CATEGORY_ENUM).toContain('cafe');
      expect(CATEGORY_ENUM).toContain('korean');
      expect(CATEGORY_ENUM).toContain('japanese');
      expect(CATEGORY_ENUM).toContain('other');
    });
  });
});
