import { describe, it, expect } from 'vitest';
import { ballColor } from './colors';

describe('src/lib/lotto-generator/colors', () => {
  describe('ballColor — official 동행복권 band colors', () => {
    it('maps 1–10 to gold with a dark numeral', () => {
      for (let i = 1; i <= 10; i++) {
        expect(ballColor(i)).toEqual({ background: '#e9a100', color: '#1a1a1a' });
      }
    });

    it('maps 11–20 to blue with white text', () => {
      for (let i = 11; i <= 20; i++) {
        expect(ballColor(i)).toEqual({ background: '#3b6fc4', color: '#ffffff' });
      }
    });

    it('maps 21–30 to red with white text', () => {
      for (let i = 21; i <= 30; i++) {
        expect(ballColor(i)).toEqual({ background: '#d23f55', color: '#ffffff' });
      }
    });

    it('maps 31–40 to gray with white text', () => {
      for (let i = 31; i <= 40; i++) {
        expect(ballColor(i)).toEqual({ background: '#7c818e', color: '#ffffff' });
      }
    });

    it('maps 41–45 to green with white text', () => {
      for (let i = 41; i <= 45; i++) {
        expect(ballColor(i)).toEqual({ background: '#2aa15a', color: '#ffffff' });
      }
    });

    it('returns background + color hex strings', () => {
      const result = ballColor(7);
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('color');
      expect(result.background).toMatch(/^#[0-9a-f]{6}$/);
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
