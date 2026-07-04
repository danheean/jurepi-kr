import { describe, it, expect } from 'vitest';
import { haversineDistance, isValidCoord } from './geo';

describe('geo', () => {
  describe('haversineDistance', () => {
    it('calculates distance between Seoul City Hall and Busan Station', () => {
      // Seoul City Hall: 37.5665, 126.9780
      // Busan Station: 35.1130, 129.0414
      const distance = haversineDistance(37.5665, 126.9780, 35.1130, 129.0414);
      // Expected distance approximately 325-330 km
      expect(distance).toBeGreaterThan(320);
      expect(distance).toBeLessThan(335);
    });

    it('returns 0 for same coordinates', () => {
      const distance = haversineDistance(37.5, 127.0, 37.5, 127.0);
      expect(distance).toBe(0);
    });

    it('calculates short distance correctly', () => {
      // Two points ~1km apart in Seoul
      const lat1 = 37.5665;
      const lng1 = 126.9780;
      const lat2 = 37.5745;
      const lng2 = 126.9880;
      const distance = haversineDistance(lat1, lng1, lat2, lng2);
      // Should be around 1 km (Haversine ~1.25 km for these coords)
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeLessThan(1.5);
    });

    it('handles symmetric calculation', () => {
      const d1 = haversineDistance(37.5665, 126.9780, 35.1130, 129.0414);
      const d2 = haversineDistance(35.1130, 129.0414, 37.5665, 126.9780);
      expect(d1).toBe(d2);
    });
  });

  describe('isValidCoord', () => {
    it('accepts Seoul coordinates', () => {
      expect(isValidCoord(37.5665, 126.9780)).toBe(true);
    });

    it('accepts Busan coordinates', () => {
      expect(isValidCoord(35.1130, 129.0414)).toBe(true);
    });

    it('accepts Jeju coordinates', () => {
      expect(isValidCoord(33.3886, 126.5627)).toBe(true);
    });

    it('rejects latitude below 33', () => {
      expect(isValidCoord(32.5, 127.0)).toBe(false);
    });

    it('rejects latitude above 39', () => {
      expect(isValidCoord(40.0, 127.0)).toBe(false);
    });

    it('rejects longitude below 124', () => {
      expect(isValidCoord(37.5, 123.0)).toBe(false);
    });

    it('rejects longitude above 132', () => {
      expect(isValidCoord(37.5, 133.0)).toBe(false);
    });

    it('accepts boundary values', () => {
      expect(isValidCoord(33, 124)).toBe(true);
      expect(isValidCoord(39, 132)).toBe(true);
    });
  });
});
