import { describe, it, expect } from 'vitest';
import { buildCoupleView } from './couple';
import type { BirthProfile } from './schema';

describe('birthday-secret/couple', () => {
  const profileA: BirthProfile = {
    date: '03-15',
    month: 3,
    flower: {
      key: '03-15',
      ko: { name: '튤립', meaning: '사랑' },
      en: { name: 'Tulip', meaning: 'love' },
      googleQuery: { ko: 'test', en: 'test' },
    },
    color: {
      key: '03-15',
      hex: '#FF69B4',
      ko: { name: '핑크', keyword: '사랑' },
      en: { name: 'Pink', keyword: 'love' },
    },
    stone: {
      month: 3,
      ko: { name: '아쿠아마린', meaning: '용기', color: 'blue', hardness: '7.5', origin: 'beryl' },
      en: { name: 'Aquamarine', meaning: 'courage', color: 'blue', hardness: '7.5', origin: 'beryl' },
      googleQuery: { ko: 'test', en: 'test' },
    },
  };

  const profileB: BirthProfile = {
    date: '07-04',
    month: 7,
    flower: {
      key: '07-04',
      ko: { name: '백합', meaning: '순결' },
      en: { name: 'Lily', meaning: 'purity' },
      googleQuery: { ko: 'test', en: 'test' },
    },
    color: {
      key: '07-04',
      hex: '#FFD700',
      ko: { name: '황금색', keyword: '부' },
      en: { name: 'Gold', keyword: 'wealth' },
    },
    stone: {
      month: 7,
      ko: { name: '루비', meaning: '열정', color: 'red', hardness: '9', origin: 'corundum' },
      en: { name: 'Ruby', meaning: 'passion', color: 'red', hardness: '9', origin: 'corundum' },
      googleQuery: { ko: 'test', en: 'test' },
    },
  };

  describe('buildCoupleView', () => {
    it('combines two profiles with their color palette', () => {
      const view = buildCoupleView(profileA, profileB);
      expect(view.a).toBe(profileA);
      expect(view.b).toBe(profileB);
      expect(view.palette).toContain('#FF69B4');
      expect(view.palette).toContain('#FFD700');
    });

    it('deduplicates colors in palette', () => {
      const view = buildCoupleView(profileA, profileA);
      expect(view.palette).toHaveLength(1); // Same color twice → dedupe
      expect(view.palette[0]).toBe('#FF69B4');
    });

    it('detects when both share same month', () => {
      const sameMonth: BirthProfile = {
        ...profileB,
        month: 3,
        stone: {
          ...profileB.stone,
          month: 3,
        },
      };
      const view = buildCoupleView(profileA, sameMonth);
      expect(view.sameMonth).toBe(true);
    });

    it('detects different months', () => {
      const view = buildCoupleView(profileA, profileB);
      expect(view.sameMonth).toBe(false);
    });

    it('handles palette with identical hex colors', () => {
      const samePalette: BirthProfile = {
        ...profileB,
        color: profileA.color, // Same hex
      };
      const view = buildCoupleView(profileA, samePalette);
      expect(view.palette).toHaveLength(1);
    });
  });
});
