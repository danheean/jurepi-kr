import { describe, it, expect } from 'vitest';
import {
  flowerByDay,
  colorByDay,
  stoneByMonth,
  monthBySlug,
  allMonths,
} from './catalog';
import type { BirthdayCatalog } from './schema';

describe('birthday-secret/catalog', () => {
  // Minimal fixture for testing
  const mockCatalog: BirthdayCatalog = {
    stones: [
      {
        month: 1,
        ko: {
          name: '석류석',
          meaning: '열정과 충성',
          color: 'deep red',
          hardness: '7.5',
          origin: 'volcanic',
        },
        en: {
          name: 'Garnet',
          meaning: 'passion and loyalty',
          color: 'deep red',
          hardness: '7.5',
          origin: 'volcanic',
        },
        googleQuery: { ko: '1월 탄생석', en: 'january birthstone' },
      },
      {
        month: 6,
        ko: {
          name: '진주',
          meaning: '순결과 우아함',
          color: 'white',
          hardness: '3.5',
          origin: 'oyster',
        },
        en: {
          name: 'Pearl',
          meaning: 'purity and grace',
          color: 'white',
          hardness: '3.5',
          origin: 'oyster',
        },
        googleQuery: { ko: '6월 탄생석', en: 'june birthstone' },
      },
    ],
    flowers: {
      '01-15': {
        key: '01-15',
        ko: { name: '동백', meaning: '노블한 기질' },
        en: { name: 'Camellia', meaning: 'noble nature' },
        googleQuery: { ko: '1월 15일 탄생화', en: 'jan 15 birth flower' },
      },
      '06-21': {
        key: '06-21',
        ko: { name: '장미', meaning: '사랑' },
        en: { name: 'Rose', meaning: 'love' },
        googleQuery: { ko: '6월 21일 탄생화', en: 'june 21 birth flower' },
      },
    },
    colors: {
      '01-15': {
        key: '01-15',
        hex: '#FF0000',
        ko: { name: '빨강', keyword: '열정' },
        en: { name: 'Red', keyword: 'passion' },
      },
      '06-21': {
        key: '06-21',
        hex: '#FFD700',
        ko: { name: '황금색', keyword: '부와 번영' },
        en: { name: 'Gold', keyword: 'wealth' },
      },
    },
    months: [
      {
        month: 1,
        slug: 'january',
        ko: { title: '1월', body: '새해의 시작을 알리는 달입니다.' },
        en: { title: 'January', body: 'The month that announces the start of the year.' },
      },
      {
        month: 6,
        slug: 'june',
        ko: { title: '6월', body: '여름의 시작 달입니다.' },
        en: { title: 'June', body: 'The beginning month of summer.' },
      },
    ],
  };

  describe('flowerByDay', () => {
    it('returns flower by MM-DD key', () => {
      const flower = flowerByDay(mockCatalog, '01-15');
      expect(flower).toBeTruthy();
      expect(flower?.key).toBe('01-15');
      expect(flower?.ko.name).toBe('동백');
    });

    it('returns null for missing key', () => {
      const flower = flowerByDay(mockCatalog, '02-14');
      expect(flower).toBeNull();
    });
  });

  describe('colorByDay', () => {
    it('returns color by MM-DD key', () => {
      const color = colorByDay(mockCatalog, '06-21');
      expect(color).toBeTruthy();
      expect(color?.key).toBe('06-21');
      expect(color?.hex).toBe('#FFD700');
    });

    it('returns null for missing key', () => {
      const color = colorByDay(mockCatalog, '03-20');
      expect(color).toBeNull();
    });
  });

  describe('stoneByMonth', () => {
    it('returns stone by month number', () => {
      const stone = stoneByMonth(mockCatalog, 1);
      expect(stone).toBeTruthy();
      expect(stone?.month).toBe(1);
      expect(stone?.ko.name).toBe('석류석');
    });

    it('returns null for missing month', () => {
      const stone = stoneByMonth(mockCatalog, 12);
      expect(stone).toBeNull();
    });
  });

  describe('monthBySlug', () => {
    it('returns month by slug', () => {
      const month = monthBySlug(mockCatalog, 'january');
      expect(month).toBeTruthy();
      expect(month?.month).toBe(1);
      expect(month?.slug).toBe('january');
    });

    it('returns null for missing slug', () => {
      const month = monthBySlug(mockCatalog, 'december');
      expect(month).toBeNull();
    });
  });

  describe('allMonths', () => {
    it('returns all months in order', () => {
      const months = allMonths(mockCatalog);
      expect(months).toHaveLength(2);
      expect(months[0].month).toBe(1);
      expect(months[1].month).toBe(6);
    });

    it('is sorted by month ascending', () => {
      // Add out-of-order item
      const unordered: BirthdayCatalog = {
        ...mockCatalog,
        months: [
          mockCatalog.months[1], // June first
          mockCatalog.months[0], // January second
        ],
      };
      const months = allMonths(unordered);
      expect(months[0].month).toBe(1);
      expect(months[1].month).toBe(6);
    });
  });
});
