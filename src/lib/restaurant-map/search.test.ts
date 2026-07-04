import { describe, it, expect } from 'vitest';
import { filterPlaces } from './search';
import type { Place } from './schema';

describe('search', () => {
  const places: Place[] = [
    {
      id: 'list#0',
      name: 'Seoul Cafe',
      lat: 37.5,
      lng: 127.0,
      category: 'cafe',
      address: 'Seoul, Korea',
      description: 'Nice cafe in Seoul',
      personalNote: 'Great coffee',
    },
    {
      id: 'list#1',
      name: '서울 한식당',
      lat: 37.6,
      lng: 127.1,
      category: 'korean',
      address: 'Seoul, Korea',
      description: '맛있는 한식',
      personalNote: '자주 간다',
    },
    {
      id: 'list#2',
      name: 'Busan Ramen',
      lat: 35.1,
      lng: 129.0,
      category: 'japanese',
      address: 'Busan, Korea',
      description: 'Best ramen shop',
      personalNote: 'Spicy and delicious',
    },
  ];

  describe('filterPlaces', () => {
    it('returns all places when query is blank', () => {
      const result = filterPlaces(places, '', 'ko');
      expect(result).toHaveLength(3);
    });

    it('matches place by English name', () => {
      const result = filterPlaces(places, 'Seoul Cafe', 'ko');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Seoul Cafe');
    });

    it('matches place by Korean name', () => {
      const result = filterPlaces(places, '서울', 'ko');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('서울 한식당');
    });

    it('matches case-insensitively', () => {
      const result = filterPlaces(places, 'SEOUL', 'ko');
      expect(result.length).toBeGreaterThan(0);
    });

    it('matches partial text', () => {
      const result = filterPlaces(places, 'cafe', 'ko');
      expect(result.length).toBeGreaterThan(0);
    });

    it('matches by category', () => {
      const result = filterPlaces(places, 'cafe', 'ko');
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('cafe');
    });

    it('trims and normalizes query', () => {
      const result = filterPlaces(places, '  Seoul  ', 'ko');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty array when no matches', () => {
      const result = filterPlaces(places, 'nonexistent', 'ko');
      expect(result).toHaveLength(0);
    });

    it('matches address field', () => {
      const result = filterPlaces(places, 'Busan', 'ko');
      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('Busan');
    });
  });
});
