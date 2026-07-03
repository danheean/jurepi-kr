import { describe, it, expect, beforeEach } from 'vitest';
import { solarToLunar, lunarToSolar } from './conversion';
import type { LunarEngine } from './conversion';

/**
 * Mock engine for testing (allows injection of pre-computed results).
 */
function createMockEngine(behavior: {
  setSolarDate?: (y: number, m: number, d: number) => boolean;
  setLunarDate?: (y: number, m: number, d: number, intercalation: boolean) => boolean;
  lunar?: { year: number; month: number; day: number; intercalation: boolean };
  solar?: { year: number; month: number; day: number };
  koreanGapja?: { year: string; month: string; day: string; intercalation: string };
}): LunarEngine {
  const lunar = behavior.lunar || { year: 2024, month: 2, day: 6, intercalation: false };
  const solar = behavior.solar || { year: 2024, month: 3, day: 15 };
  const koreanGapja = behavior.koreanGapja || { year: '갑진년', month: '정묘월', day: '무인일', intercalation: '' };

  return {
    setSolarDate: behavior.setSolarDate || (() => true),
    getLunarCalendar: () => lunar,
    setLunarDate: behavior.setLunarDate || (() => true),
    getSolarCalendar: () => solar,
    getKoreanGapja: () => koreanGapja,
  };
}

describe('conversion', () => {
  describe('solarToLunar', () => {
    it('converts 2024-03-15 to 2024년 2월 6일 (평달)', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2024, month: 2, day: 6, intercalation: false },
      });

      const result = await solarToLunar(2024, 3, 15, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      expect(result).toMatchObject({
        solarDate: { year: 2024, month: 3, day: 15 },
        lunarDate: { year: 2024, month: 2, day: 6, isLeap: false },
        sexagenary: { name: '갑진년', hanja: '甲辰', english: 'Wood Dragon' },
        zodiac: { key: 'dragon', emoji: '🐉' },
      });
    });

    it('converts 2023-04-04 to 2023년 윤2월 14일', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2023, month: 2, day: 14, intercalation: true },
      });

      const result = await solarToLunar(2023, 4, 4, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.lunarDate.isLeap).toBe(true);
      expect(converted.lunarDate.month).toBe(2);
      expect(converted.lunarDate.day).toBe(14);
    });

    it('rejects 1390-01-01 as out_of_range', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(1390, 1, 1, engine);
      expect(result).toEqual({ error: 'out_of_range' });
    });

    it('rejects 2051-01-01 as out_of_range', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(2051, 1, 1, engine);
      expect(result).toEqual({ error: 'out_of_range' });
    });

    it('rejects invalid month (13)', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(2024, 13, 1, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('rejects invalid day (Feb 30)', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(2024, 2, 30, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('rejects day 0', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(2024, 3, 0, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('returns error when engine setSolarDate returns false', async () => {
      const engine = createMockEngine({
        setSolarDate: () => false,
      });

      const result = await solarToLunar(2024, 3, 15, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('converts 2024-10-18 to 2024년 9월 16일', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2024, month: 9, day: 16, intercalation: false },
      });

      const result = await solarToLunar(2024, 10, 18, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.lunarDate).toEqual({ year: 2024, month: 9, day: 16, isLeap: false });
    });

    it('includes sexagenary and zodiac in result', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2024, month: 2, day: 6, intercalation: false },
      });

      const result = await solarToLunar(2024, 3, 15, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.sexagenary).toBeDefined();
      expect(converted.sexagenary.name).toBe('갑진년');
      expect(converted.sexagenary.hanja).toBe('甲辰');
      expect(converted.zodiac).toBeDefined();
      expect(converted.zodiac.key).toBe('dragon');
    });
  });

  describe('lunarToSolar', () => {
    it('converts 2024-01-01 (lunar) to 2024-02-10 (solar)', async () => {
      const engine = createMockEngine({
        setLunarDate: () => true,
        solar: { year: 2024, month: 2, day: 10 },
      });

      const result = await lunarToSolar(2024, 1, 1, false, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.solarDate).toEqual({ year: 2024, month: 2, day: 10 });
    });

    it('converts 2023 윤2월 15일 (leap) to 2023-04-05', async () => {
      const engine = createMockEngine({
        setLunarDate: () => true,
        solar: { year: 2023, month: 4, day: 5 },
      });

      const result = await lunarToSolar(2023, 2, 15, true, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.solarDate).toEqual({ year: 2023, month: 4, day: 5 });
      expect(converted.lunarDate.isLeap).toBe(true);
    });

    it('rejects 2024 윤달 (no leap month) with error', async () => {
      const engine = createMockEngine({
        setLunarDate: (y, m, d, leap) => !leap, // false only if leap=true
      });

      const result = await lunarToSolar(2024, 1, 1, true, engine);
      expect(result).toEqual({ error: 'no_leap_month' });
    });

    it('returns invalid_date error for leap=false when setLunarDate fails', async () => {
      const engine = createMockEngine({
        setLunarDate: () => false,
      });

      const result = await lunarToSolar(2024, 1, 1, false, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('rejects 1390-01-01 as out_of_range', async () => {
      const engine = createMockEngine({});
      const result = await lunarToSolar(1390, 1, 1, false, engine);
      expect(result).toEqual({ error: 'out_of_range' });
    });

    it('rejects 2051-01-01 as out_of_range', async () => {
      const engine = createMockEngine({});
      const result = await lunarToSolar(2051, 1, 1, false, engine);
      expect(result).toEqual({ error: 'out_of_range' });
    });

    it('rejects invalid month (13)', async () => {
      const engine = createMockEngine({});
      const result = await lunarToSolar(2024, 13, 1, false, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('rejects invalid day (31)', async () => {
      const engine = createMockEngine({});
      const result = await lunarToSolar(2024, 1, 31, false, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('rejects day 0', async () => {
      const engine = createMockEngine({});
      const result = await lunarToSolar(2024, 1, 0, false, engine);
      expect(result).toEqual({ error: 'invalid_date' });
    });

    it('converts 2024-08-15 (lunar) to 2024-09-17 (solar)', async () => {
      const engine = createMockEngine({
        setLunarDate: () => true,
        solar: { year: 2024, month: 9, day: 17 },
      });

      const result = await lunarToSolar(2024, 8, 15, false, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.solarDate).toEqual({ year: 2024, month: 9, day: 17 });
    });

    it('includes sexagenary and zodiac computed from lunar year', async () => {
      const engine = createMockEngine({
        setLunarDate: () => true,
        solar: { year: 2024, month: 2, day: 10 },
      });

      const result = await lunarToSolar(2024, 1, 1, false, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.sexagenary).toBeDefined();
      expect(converted.sexagenary.hanja).toBe('甲辰'); // 2024
      expect(converted.zodiac).toBeDefined();
      expect(converted.zodiac.key).toBe('dragon'); // 2024
    });

    it('converts 2050-01-01 (lunar) to 2050-01-23 (solar)', async () => {
      const engine = createMockEngine({
        setLunarDate: () => true,
        solar: { year: 2050, month: 1, day: 23 },
      });

      const result = await lunarToSolar(2050, 1, 1, false, engine);
      expect(result).not.toEqual({ error: expect.any(String) });
      const converted = result as any;
      expect(converted.solarDate).toEqual({ year: 2050, month: 1, day: 23 });
    });
  });

  describe('boundary testing', () => {
    it('accepts min boundary year 1391', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 1390, month: 11, day: 18, intercalation: false },
      });

      const result = await solarToLunar(1391, 1, 1, engine);
      expect(result).not.toEqual({ error: 'out_of_range' });
    });

    it('accepts max boundary year 2050', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2050, month: 11, day: 18, intercalation: false },
      });

      const result = await solarToLunar(2050, 12, 31, engine);
      expect(result).not.toEqual({ error: 'out_of_range' });
    });

    it('rejects year below min (1390)', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(1390, 1, 1, engine);
      expect(result).toEqual({ error: 'out_of_range' });
    });

    it('rejects year above max (2051)', async () => {
      const engine = createMockEngine({});
      const result = await solarToLunar(2051, 1, 1, engine);
      expect(result).toEqual({ error: 'out_of_range' });
    });
  });

  describe('golden cross-check: sexagenary/zodiac match lunar year', () => {
    it('2024 conversion has sexagenary 갑진 (Wood Dragon)', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2024, month: 2, day: 6, intercalation: false },
      });

      const result = await solarToLunar(2024, 3, 15, engine);
      const converted = result as any;
      expect(converted.sexagenary.hanja).toBe('甲辰');
      expect(converted.sexagenary.english).toBe('Wood Dragon');
      expect(converted.zodiac.key).toBe('dragon');
      expect(converted.zodiac.emoji).toBe('🐉');
    });

    it('2023 conversion has sexagenary 계묘 (Water Rabbit)', async () => {
      const engine = createMockEngine({
        setLunarDate: () => true,
        solar: { year: 2023, month: 4, day: 5 },
      });

      const result = await lunarToSolar(2023, 2, 15, true, engine);
      const converted = result as any;
      expect(converted.sexagenary.hanja).toBe('癸卯');
      expect(converted.sexagenary.english).toBe('Water Rabbit');
      expect(converted.zodiac.key).toBe('rabbit');
      expect(converted.zodiac.emoji).toBe('🐰');
    });

    it('1391 input converts to lunar 1390, sexagenary 경오 (Metal Horse)', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 1390, month: 11, day: 18, intercalation: false },
      });

      const result = await solarToLunar(1391, 1, 1, engine);
      const converted = result as any;
      expect(converted.sexagenary.hanja).toBe('庚午');
      expect(converted.sexagenary.english).toBe('Metal Horse');
      expect(converted.zodiac.key).toBe('horse');
    });

    it('2050 conversion has sexagenary 경오 (Metal Horse)', async () => {
      const engine = createMockEngine({
        setSolarDate: () => true,
        lunar: { year: 2050, month: 11, day: 18, intercalation: false },
      });

      const result = await solarToLunar(2050, 12, 31, engine);
      const converted = result as any;
      expect(converted.sexagenary.hanja).toBe('庚午');
      expect(converted.sexagenary.english).toBe('Metal Horse');
      expect(converted.zodiac.key).toBe('horse');
    });
  });
});
