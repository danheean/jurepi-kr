import { describe, it, expect } from 'vitest';
import { buildProfile } from './profile';
import type { BirthdayCatalog } from './schema';

describe('birthday-secret/profile', () => {
  const mockCatalog: BirthdayCatalog = {
    stones: [
      {
        month: 1,
        ko: {
          name: '석류석',
          meaning: '열정과 충성',
          color: 'red',
          hardness: '7.5',
          origin: 'volcanic',
        },
        en: {
          name: 'Garnet',
          meaning: 'passion and loyalty',
          color: 'red',
          hardness: '7.5',
          origin: 'volcanic',
        },
        googleQuery: { ko: '1월 탄생석', en: 'january birthstone' },
      },
      {
        month: 2,
        ko: {
          name: '자수정',
          meaning: '순결',
          color: 'purple',
          hardness: '7',
          origin: 'quartz',
        },
        en: {
          name: 'Amethyst',
          meaning: 'purity',
          color: 'purple',
          hardness: '7',
          origin: 'quartz',
        },
        googleQuery: { ko: '2월 탄생석', en: 'february birthstone' },
      },
    ],
    flowers: {
      '01-15': {
        key: '01-15',
        ko: { name: '동백', meaning: '노블함' },
        en: { name: 'Camellia', meaning: 'nobility' },
        googleQuery: { ko: '1월 15일 탄생화', en: 'jan 15 flower' },
      },
      '01-31': {
        key: '01-31',
        ko: { name: '수선화', meaning: '자경' },
        en: { name: 'Narcissus', meaning: 'self-regard' },
        googleQuery: { ko: '1월 31일 탄생화', en: 'jan 31 flower' },
      },
      '02-15': {
        key: '02-15',
        ko: { name: '비올렛', meaning: '신실' },
        en: { name: 'Violet', meaning: 'faithfulness' },
        googleQuery: { ko: '2월 15일 탄생화', en: 'feb 15 flower' },
      },
      '02-29': {
        key: '02-29',
        ko: { name: '매화', meaning: '충절' },
        en: { name: 'Plum blossom', meaning: 'faithfulness' },
        googleQuery: { ko: '2월 29일 탄생화', en: 'feb 29 flower' },
      },
    },
    colors: {
      '01-15': {
        key: '01-15',
        hex: '#FF0000',
        ko: { name: '빨강', keyword: '열정' },
        en: { name: 'Red', keyword: 'passion' },
      },
      '01-31': {
        key: '01-31',
        hex: '#FFFF00',
        ko: { name: '노랑', keyword: '희망' },
        en: { name: 'Yellow', keyword: 'hope' },
      },
      '02-15': {
        key: '02-15',
        hex: '#FFC0CB',
        ko: { name: '분홍', keyword: '사랑' },
        en: { name: 'Pink', keyword: 'love' },
      },
      '02-29': {
        key: '02-29',
        hex: '#800080',
        ko: { name: '자주색', keyword: '우아함' },
        en: { name: 'Purple', keyword: 'elegance' },
      },
    },
    months: [
      {
        month: 1,
        slug: 'january',
        ko: { title: '1월', body: '새해의 달입니다.' },
        en: { title: 'January', body: 'Month of new year.' },
      },
      {
        month: 2,
        slug: 'february',
        ko: { title: '2월', body: '사랑의 달입니다.' },
        en: { title: 'February', body: 'Month of love.' },
      },
    ],
  };

  describe('buildProfile', () => {
    it('builds a complete profile from valid MM-DD key', () => {
      const profile = buildProfile(mockCatalog, '01-15');
      expect(profile).toBeTruthy();
      expect(profile?.date).toBe('01-15');
      expect(profile?.month).toBe(1);
      expect(profile?.flower.key).toBe('01-15');
      expect(profile?.flower.ko.name).toBe('동백');
      expect(profile?.color.hex).toBe('#FF0000');
      expect(profile?.stone.month).toBe(1);
      expect(profile?.stone.ko.name).toBe('석류석');
    });

    it('works with Feb 29 (leap day)', () => {
      const profile = buildProfile(mockCatalog, '02-29');
      expect(profile).toBeTruthy();
      expect(profile?.date).toBe('02-29');
      expect(profile?.month).toBe(2);
      expect(profile?.flower.ko.name).toBe('매화');
      expect(profile?.stone.ko.name).toBe('자수정');
    });

    it('returns null for invalid date format', () => {
      const profile = buildProfile(mockCatalog, '1-15');
      expect(profile).toBeNull();
    });

    it('returns null for invalid month/day combination', () => {
      const profile = buildProfile(mockCatalog, '02-30'); // Feb doesn't have 30 days
      expect(profile).toBeNull();
    });

    it('returns null if flower data is missing', () => {
      const incompleteCatalog: BirthdayCatalog = {
        ...mockCatalog,
        flowers: {}, // No flowers
      };
      const profile = buildProfile(incompleteCatalog, '01-15');
      expect(profile).toBeNull();
    });

    it('returns null if color data is missing', () => {
      const incompleteCatalog: BirthdayCatalog = {
        ...mockCatalog,
        colors: {}, // No colors
      };
      const profile = buildProfile(incompleteCatalog, '01-15');
      expect(profile).toBeNull();
    });

    it('returns null if stone data is missing', () => {
      const incompleteCatalog: BirthdayCatalog = {
        ...mockCatalog,
        stones: [], // No stones
      };
      const profile = buildProfile(incompleteCatalog, '01-15');
      expect(profile).toBeNull();
    });

    it('maps day to correct month for stone lookup', () => {
      const profile1 = buildProfile(mockCatalog, '01-15');
      const profile2 = buildProfile(mockCatalog, '01-31');
      expect(profile1?.stone.month).toBe(1);
      expect(profile2?.stone.month).toBe(1); // Both January days get Jan stone
    });

    it('maps Feb dates to Feb stone', () => {
      const profile = buildProfile(mockCatalog, '02-15');
      expect(profile?.stone.month).toBe(2);
    });
  });
});
