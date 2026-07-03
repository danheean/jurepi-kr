import { describe, it, expect } from 'vitest';
import { computeZodiac } from './zodiac';
import { computeSexagenary } from './sexagenary';

describe('zodiac', () => {
  describe('computeZodiac', () => {
    it('computes 2024 as dragon (🐉)', () => {
      const result = computeZodiac(2024);
      expect(result.key).toBe('dragon');
      expect(result.emoji).toBe('🐉');
      expect(result.branchIndex).toBe(4); // 辰
    });

    it('computes 2023 as rabbit (🐰)', () => {
      const result = computeZodiac(2023);
      expect(result.key).toBe('rabbit');
      expect(result.emoji).toBe('🐰');
      expect(result.branchIndex).toBe(3); // 卯
    });

    it('computes 1390 as horse (🐴)', () => {
      const result = computeZodiac(1390);
      expect(result.key).toBe('horse');
      expect(result.emoji).toBe('🐴');
      expect(result.branchIndex).toBe(6); // 午
    });

    it('computes 2050 as horse (🐴)', () => {
      const result = computeZodiac(2050);
      expect(result.key).toBe('horse');
      expect(result.emoji).toBe('🐴');
      expect(result.branchIndex).toBe(6); // 午
    });

    it('computes 2025 as snake (🐍)', () => {
      const result = computeZodiac(2025);
      expect(result.key).toBe('snake');
      expect(result.emoji).toBe('🐍');
      expect(result.branchIndex).toBe(5); // 巳
    });

    it('cycles through all 12 animals across 60 years', () => {
      const baseYear = 2024; // dragon
      const animals = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

      for (let i = 0; i < 12; i++) {
        const year = baseYear - 4 + i; // dragon is at index 4, so baseYear - 4 = rat
        const result = computeZodiac(year);
        expect(result.key).toBe(animals[i]);
        expect(result.branchIndex).toBe(i);
      }
    });

    it('handles modulo arithmetic correctly (year + 12 = same zodiac)', () => {
      const result1 = computeZodiac(2024);
      const result2 = computeZodiac(2024 + 12);
      expect(result2.key).toBe(result1.key);
      expect(result2.emoji).toBe(result1.emoji);
      expect(result2.branchIndex).toBe(result1.branchIndex);
    });

    it('returns lowercase stable keys for i18n mapping', () => {
      const result = computeZodiac(2024);
      expect(result.key).toBe(result.key.toLowerCase());
      expect(result.key).toMatch(/^[a-z]+$/);
    });

    it('returns valid emoji characters', () => {
      const animals = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];
      const emojis = ['🐀', '🐂', '🐯', '🐰', '🐉', '🐍', '🐴', '🐑', '🐵', '🐓', '🐕', '🐷'];

      for (let i = 0; i < 12; i++) {
        const year = 2024 - 4 + i;
        const result = computeZodiac(year);
        expect(result.key).toBe(animals[i]);
        expect(result.emoji).toBe(emojis[i]);
      }
    });

    it('validates span from 1391 to 2050 produces valid branch indices', () => {
      for (let year = 1391; year <= 2050; year += 10) {
        const result = computeZodiac(year);
        expect(result.branchIndex).toBeGreaterThanOrEqual(0);
        expect(result.branchIndex).toBeLessThan(12);
        expect(result.key).toBeTruthy();
        expect(result.emoji).toBeTruthy();
      }
    });

    it('matches sexagenary branch indices for the same year', () => {
      const year = 2024;
      const zodiacResult = computeZodiac(year);
      const sexResult = computeSexagenary(year);
      expect(zodiacResult.branchIndex).toBe(sexResult.branchIndex);
    });
  });
});
