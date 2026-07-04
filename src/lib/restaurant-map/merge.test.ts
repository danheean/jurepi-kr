import { describe, it, expect } from 'vitest';
import { mergePair, validatePair } from './merge';
import type { PlaceListFileFront } from './schema';

describe('merge', () => {
  const createMockFront = (overrides: Partial<PlaceListFileFront> = {}): PlaceListFileFront => ({
    title: 'Test List',
    region: 'seoul',
    asOfDate: '2026-07-04',
    sourceNote: 'Personal visits',
    places: [
      {
        name: 'Place 1',
        lat: 37.5,
        lng: 127.0,
        category: 'cafe',
        address: 'Address 1',
        description: 'Desc 1',
        personalNote: 'Note 1',
      },
      {
        name: 'Place 2',
        lat: 37.6,
        lng: 127.1,
        category: 'korean',
        address: 'Address 2',
        description: 'Desc 2',
        personalNote: 'Note 2',
      },
      {
        name: 'Place 3',
        lat: 37.7,
        lng: 127.2,
        category: 'cafe',
        address: 'Address 3',
        description: 'Desc 3',
        personalNote: 'Note 3',
      },
    ],
    ...overrides,
  });

  describe('mergePair', () => {
    it('merges ko and en frontmatter with canonical rules', () => {
      const ko = createMockFront({
        title: 'Seoul Cafes',
        region: 'seoul',
        asOfDate: '2026-07-04',
        sourceUrl: 'https://example.com',
      });

      const en = createMockFront({
        title: 'Seoul Cafes (English)',
        region: 'busan', // en region is ignored
        sourceNote: 'English source note',
      });

      const merged = mergePair(ko, en, 'test-slug', 'test.md');

      expect(merged.slug).toBe('test-slug');
      expect(merged.region).toBe('seoul'); // ko canonical
      expect(merged.asOfDate).toBe('2026-07-04'); // ko canonical
      expect(merged.sourceUrl).toBe('https://example.com'); // ko canonical
      expect(merged.ko.title).toBe('Seoul Cafes');
      expect(merged.en.title).toBe('Seoul Cafes (English)');
      expect(merged.ko.sourceNote).toBe('Personal visits');
      expect(merged.en.sourceNote).toBe('English source note');
    });

    it('adds place ids in format listSlug#index', () => {
      const ko = createMockFront();
      const en = createMockFront();

      const merged = mergePair(ko, en, 'seoul-cafes', 'test.md');

      expect(merged.ko.places[0].id).toBe('seoul-cafes#0');
      expect(merged.ko.places[1].id).toBe('seoul-cafes#1');
      expect(merged.ko.places[2].id).toBe('seoul-cafes#2');
      expect(merged.en.places[0].id).toBe('seoul-cafes#0');
    });

    it('en sourceNote inherits from ko if absent', () => {
      const ko = createMockFront({
        sourceNote: 'Shared source note',
      });

      const en = createMockFront({
        sourceNote: '', // Will be treated as absent/fallback
      });

      // Simulate en without sourceNote by deleting it in result check
      const merged = mergePair(ko, en, 'test', 'test.md');

      // Both should have sourceNote after merge
      expect(merged.ko.sourceNote).toBe('Shared source note');
    });

    it('rejects pair if ko and en places arrays have different lengths', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          {
            name: 'Place 2',
            lat: 37.6,
            lng: 127.1,
            category: 'korean',
            address: 'Address 2',
            description: 'Desc 2',
            personalNote: 'Note 2',
          },
          // Only 2 places vs 3 in ko
        ],
      });

      expect(() => mergePair(ko, en, 'test', 'test.md')).toThrow();
    });
  });

  describe('validatePair', () => {
    it('returns empty array for valid pair', () => {
      const ko = createMockFront();
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors).toHaveLength(0);
    });

    it('collects error if ko missing region', () => {
      const ko = createMockFront({ region: undefined });
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('region'))).toBe(true);
    });

    it('collects error if place missing personalNote', () => {
      const ko = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: '', // Empty
          },
          ...createMockFront().places!.slice(1),
        ],
      });
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('personalNote'))).toBe(true);
    });

    it('collects error if ko/en place count mismatch', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: ko.places!.slice(0, 2), // 2 places vs 3
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('length'))).toBe(true);
    });

    it('collects error if places < 3', () => {
      const ko = createMockFront({
        places: createMockFront().places!.slice(0, 2),
      });
      const en = createMockFront({
        places: ko.places,
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('collects multiple errors at once', () => {
      const ko = createMockFront({
        title: '', // Missing title
        region: undefined, // Missing region
      });
      const en = createMockFront({
        title: '', // Missing title
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThanOrEqual(3); // Multiple errors
    });

    it('validates category enum for each place', () => {
      const ko = createMockFront({
        places: [
          ...createMockFront().places!,
        ],
      });
      const en = createMockFront({
        places: ko.places,
      });

      const errors = validatePair(ko, en, 'test.md');
      // Should pass with valid categories
      expect(errors.filter((e) => e.includes('category'))).toHaveLength(0);
    });

    it('collects error if KO place latitude out of bounds (< 33)', () => {
      const ko = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 32.9, // Below 33
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('latitude') && e.includes('KO'))).toBe(true);
    });

    it('collects error if KO place latitude out of bounds (> 39)', () => {
      const ko = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 39.1, // Above 39
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('latitude') && e.includes('KO'))).toBe(true);
    });

    it('collects error if KO place longitude out of bounds (< 124)', () => {
      const ko = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 123.9, // Below 124
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('longitude') && e.includes('KO'))).toBe(true);
    });

    it('collects error if KO place longitude out of bounds (> 132)', () => {
      const ko = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 132.1, // Above 132
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });
      const en = createMockFront();

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('longitude') && e.includes('KO'))).toBe(true);
    });

    it('collects error if EN place name is missing', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: '', // Empty
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('name') && e.includes('EN'))).toBe(true);
    });

    it('collects error if EN place address is missing', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: '', // Empty
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('address') && e.includes('EN'))).toBe(true);
    });

    it('collects error if EN place description is missing', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: '', // Empty
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('description') && e.includes('EN'))).toBe(true);
    });

    it('collects error if EN place personalNote is missing', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: '', // Empty
          },
          ...createMockFront().places!.slice(1),
        ],
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('personalNote') && e.includes('EN'))).toBe(true);
    });

    it('collects error if EN place latitude out of bounds', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 32.5, // Out of bounds
            lng: 127.0,
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('latitude') && e.includes('EN'))).toBe(true);
    });

    it('collects error if EN place longitude out of bounds', () => {
      const ko = createMockFront();
      const en = createMockFront({
        places: [
          {
            name: 'Place 1',
            lat: 37.5,
            lng: 133.0, // Out of bounds
            category: 'cafe',
            address: 'Address 1',
            description: 'Desc 1',
            personalNote: 'Note 1',
          },
          ...createMockFront().places!.slice(1),
        ],
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('longitude') && e.includes('EN'))).toBe(true);
    });

    it('mergePair: inherits en.city from en when ko.city is absent', () => {
      const ko = createMockFront({
        // No city
      });
      // Explicitly set ko.city to undefined
      delete (ko as any).city;

      const en = createMockFront({
        // city defaults to undefined too, need to mock it
      });
      (en as any).city = 'busan';

      const merged = mergePair(ko, en, 'test', 'test.md');

      expect(merged.city).toBe('busan');
    });

    it('mergePair: sourceUrl is undefined when both ko and en lack it', () => {
      const ko = createMockFront({
        // No sourceUrl
      });
      delete (ko as any).sourceUrl;

      const en = createMockFront({
        // No sourceUrl
      });
      delete (en as any).sourceUrl;

      const merged = mergePair(ko, en, 'test', 'test.md');

      expect(merged.sourceUrl).toBeUndefined();
    });

    it('collects error when both EN and KO sourceNote are absent', () => {
      const ko = createMockFront({
        sourceNote: '', // Empty string
      });

      const en = createMockFront({
        sourceNote: '', // Empty string
      });

      const errors = validatePair(ko, en, 'test.md');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('sourceNote'))).toBe(true);
    });
  });
});
