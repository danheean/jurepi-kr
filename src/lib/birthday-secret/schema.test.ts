import { describe, it, expect } from 'vitest';
import {
  HEX_RE,
  MonthDaySchema,
  StoneSchema,
  FlowerSchema,
  ColorSchema,
  MonthSchema,
  CatalogSchema,
} from './schema';

describe('birthday-secret/schema', () => {
  describe('HEX_RE', () => {
    it('matches valid hex colors', () => {
      expect(HEX_RE.test('#000000')).toBe(true);
      expect(HEX_RE.test('#FFFFFF')).toBe(true);
      expect(HEX_RE.test('#abc123')).toBe(true);
      expect(HEX_RE.test('#ABC123')).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      expect(HEX_RE.test('#00000')).toBe(false); // too short
      expect(HEX_RE.test('#0000000')).toBe(false); // too long
      expect(HEX_RE.test('000000')).toBe(false); // no #
      expect(HEX_RE.test('#GGGGGG')).toBe(false); // invalid chars
    });
  });

  describe('MonthDaySchema', () => {
    it('validates MM-DD format', () => {
      const result = MonthDaySchema.safeParse('01-15');
      expect(result.success).toBe(true);
      expect(result.data).toBe('01-15');
    });

    it('rejects invalid formats', () => {
      expect(MonthDaySchema.safeParse('1-15').success).toBe(false);
      expect(MonthDaySchema.safeParse('01/15').success).toBe(false);
      expect(MonthDaySchema.safeParse('0115').success).toBe(false);
      expect(MonthDaySchema.safeParse('13-01').success).toBe(false); // month >12
    });

    it('allows 02-29 for leap day', () => {
      const result = MonthDaySchema.safeParse('02-29');
      expect(result.success).toBe(true);
    });
  });

  describe('StoneSchema', () => {
    it('validates stone object', () => {
      const stone = {
        month: 6,
        ko: {
          name: '진주',
          meaning: '여름의 눈물',
          color: 'white',
          hardness: '3.5',
          origin: '굴',
        },
        en: {
          name: 'Pearl',
          meaning: 'summer tears',
          color: 'white',
          hardness: '3.5',
          origin: 'oyster',
        },
        googleQuery: { ko: '6월 탄생석', en: 'june birthstone' },
      };
      const result = StoneSchema.safeParse(stone);
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const result = StoneSchema.safeParse({ month: 1 });
      expect(result.success).toBe(false);
    });

    it('enforces month 1..12', () => {
      const stone = {
        month: 13,
        ko: {
          name: 'test',
          meaning: 'test',
          color: 'test',
          hardness: 'test',
          origin: 'test',
        },
        en: {
          name: 'test',
          meaning: 'test',
          color: 'test',
          hardness: 'test',
          origin: 'test',
        },
        googleQuery: { ko: 'test', en: 'test' },
      };
      const result = StoneSchema.safeParse(stone);
      expect(result.success).toBe(false);
    });
  });

  describe('FlowerSchema', () => {
    it('validates flower object', () => {
      const flower = {
        key: '03-15',
        ko: {
          name: '카네이션',
          meaning: '모성애',
        },
        en: {
          name: 'Carnation',
          meaning: 'maternal love',
        },
        googleQuery: { ko: '3월 15일 탄생화', en: 'march 15 birth flower' },
      };
      const result = FlowerSchema.safeParse(flower);
      expect(result.success).toBe(true);
    });

    it('rejects invalid key format', () => {
      const flower = {
        key: '3-15',
        ko: { name: 'test', meaning: 'test' },
        en: { name: 'test', meaning: 'test' },
        googleQuery: { ko: 'test', en: 'test' },
      };
      const result = FlowerSchema.safeParse(flower);
      expect(result.success).toBe(false);
    });
  });

  describe('ColorSchema', () => {
    it('validates color object', () => {
      const color = {
        key: '01-01',
        hex: '#FF0000',
        ko: { name: '빨강', keyword: '열정' },
        en: { name: 'Red', keyword: 'passion' },
      };
      const result = ColorSchema.safeParse(color);
      expect(result.success).toBe(true);
    });

    it('rejects invalid hex', () => {
      const color = {
        key: '01-01',
        hex: 'FF0000',
        ko: { name: 'test', keyword: 'test' },
        en: { name: 'test', keyword: 'test' },
      };
      const result = ColorSchema.safeParse(color);
      expect(result.success).toBe(false);
    });
  });

  describe('MonthSchema', () => {
    it('validates month object', () => {
      const month = {
        month: 1,
        slug: 'january',
        ko: {
          title: '1월의 의미',
          body: '1월은 새로운 시작의 달입니다.',
        },
        en: {
          title: 'Meaning of January',
          body: 'January is the month of new beginnings.',
        },
      };
      const result = MonthSchema.safeParse(month);
      expect(result.success).toBe(true);
    });

    it('rejects invalid month number', () => {
      const month = {
        month: 13,
        slug: 'january',
        ko: { title: 'test', body: 'test' },
        en: { title: 'test', body: 'test' },
      };
      const result = MonthSchema.safeParse(month);
      expect(result.success).toBe(false);
    });
  });

  describe('CatalogSchema', () => {
    it('validates full catalog', () => {
      const catalog = {
        stones: [
          {
            month: 1,
            ko: {
              name: '석류석',
              meaning: '열정',
              color: 'red',
              hardness: '7.5',
              origin: 'volcanic',
            },
            en: {
              name: 'Garnet',
              meaning: 'passion',
              color: 'red',
              hardness: '7.5',
              origin: 'volcanic',
            },
            googleQuery: { ko: '1월 탄생석', en: 'january birthstone' },
          },
        ],
        flowers: {
          '01-01': {
            key: '01-01',
            ko: { name: '빨강장미', meaning: '사랑' },
            en: { name: 'Red Rose', meaning: 'love' },
            googleQuery: { ko: '1월 1일 탄생화', en: 'jan 1 flower' },
          },
        },
        colors: {
          '01-01': {
            key: '01-01',
            hex: '#FF0000',
            ko: { name: '빨강', keyword: '열정' },
            en: { name: 'Red', keyword: 'passion' },
          },
        },
        months: [
          {
            month: 1,
            slug: 'january',
            ko: { title: '1월', body: '새해의 시작' },
            en: { title: 'January', body: 'start of year' },
          },
        ],
      };
      const result = CatalogSchema.safeParse(catalog);
      expect(result.success).toBe(true);
    });
  });
});
