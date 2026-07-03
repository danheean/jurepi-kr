import { describe, it, expect } from 'vitest';
import { computeSexagenary } from './sexagenary';

describe('sexagenary', () => {
  describe('computeSexagenary', () => {
    it('computes 2024 as 갑진 (甲辰 Wood Dragon)', () => {
      const result = computeSexagenary(2024);
      expect(result.name).toBe('갑진년');
      expect(result.hanja).toBe('甲辰');
      expect(result.english).toBe('Wood Dragon');
      expect(result.stemIndex).toBe(0); // 甲
      expect(result.branchIndex).toBe(4); // 辰
    });

    it('computes 2023 as 계묘 (癸卯 Water Rabbit)', () => {
      const result = computeSexagenary(2023);
      expect(result.name).toBe('계묘년');
      expect(result.hanja).toBe('癸卯');
      expect(result.english).toBe('Water Rabbit');
      expect(result.stemIndex).toBe(9); // 癸
      expect(result.branchIndex).toBe(3); // 卯
    });

    it('computes 1390 as 경오 (庚午 Metal Horse)', () => {
      const result = computeSexagenary(1390);
      expect(result.hanja).toBe('庚午');
      expect(result.english).toBe('Metal Horse');
      expect(result.stemIndex).toBe(6); // 庚
      expect(result.branchIndex).toBe(6); // 午
    });

    it('computes 2050 as 경오 (庚午 Metal Horse)', () => {
      const result = computeSexagenary(2050);
      expect(result.hanja).toBe('庚午');
      expect(result.english).toBe('Metal Horse');
      expect(result.stemIndex).toBe(6); // 庚
      expect(result.branchIndex).toBe(6); // 午
    });

    it('computes 2025 as 을사 (乙蛇 Wood Snake)', () => {
      const result = computeSexagenary(2025);
      expect(result.name).toBe('을사년');
      expect(result.hanja).toBe('乙巳');
      expect(result.english).toBe('Wood Snake');
      expect(result.stemIndex).toBe(1); // 乙
      expect(result.branchIndex).toBe(5); // 巳
    });

    it('handles modulo arithmetic correctly for large years', () => {
      // 2024 and 2024+60 should have the same sexagenary
      const result1 = computeSexagenary(2024);
      const result2 = computeSexagenary(2024 + 60);
      expect(result2.name).toBe(result1.name);
      expect(result2.hanja).toBe(result1.hanja);
      expect(result2.english).toBe(result1.english);
    });

    it('handles negative modulo correctly for edge years', () => {
      // Test years that require careful modulo handling
      const result = computeSexagenary(1391);
      expect(result.stemIndex).toBeGreaterThanOrEqual(0);
      expect(result.stemIndex).toBeLessThan(10);
      expect(result.branchIndex).toBeGreaterThanOrEqual(0);
      expect(result.branchIndex).toBeLessThan(12);
    });

    it('returns name in Korean format (갑진년)', () => {
      const result = computeSexagenary(2024);
      expect(result.name).toMatch(/^[가-힣]+년$/);
    });

    it('returns hanja with two Chinese characters', () => {
      const result = computeSexagenary(2024);
      expect(result.hanja).toHaveLength(2);
      // Verify hanja are CJK characters
      expect(result.hanja.charCodeAt(0)).toBeGreaterThan(0x4e00);
      expect(result.hanja.charCodeAt(1)).toBeGreaterThan(0x4e00);
    });

    it('returns English with element and animal', () => {
      const result = computeSexagenary(2024);
      expect(result.english).toContain(' ');
      const [element, animal] = result.english.split(' ');
      expect(['Wood', 'Fire', 'Earth', 'Metal', 'Water']).toContain(element);
      expect(['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']).toContain(animal);
    });
  });

  describe('cross-check with verified KASI anchors', () => {
    it('matches 2024 = 갑진년 (stem=甲, branch=辰)', () => {
      const result = computeSexagenary(2024);
      expect(result.hanja).toBe('甲辰');
      // 甲 index 0, 辰 index 4
      expect(result.stemIndex).toBe(0);
      expect(result.branchIndex).toBe(4);
    });

    it('matches 2023 = 계묘년 (stem=癸, branch=卯)', () => {
      const result = computeSexagenary(2023);
      expect(result.hanja).toBe('癸卯');
      // 癸 index 9, 卯 index 3
      expect(result.stemIndex).toBe(9);
      expect(result.branchIndex).toBe(3);
    });

    it('validates span from 1390 to 2050 produces valid indices (lunar years)', () => {
      for (let year = 1390; year <= 2050; year += 10) {
        const result = computeSexagenary(year);
        expect(result.stemIndex).toBeGreaterThanOrEqual(0);
        expect(result.stemIndex).toBeLessThan(10);
        expect(result.branchIndex).toBeGreaterThanOrEqual(0);
        expect(result.branchIndex).toBeLessThan(12);
        expect(result.hanja).toHaveLength(2);
        expect(result.name).toBeTruthy();
        expect(result.english).toBeTruthy();
      }
    });
  });
});
