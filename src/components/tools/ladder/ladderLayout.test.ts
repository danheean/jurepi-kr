import { describe, it, expect } from 'vitest';
import { levelHeightFor, traceDurationMs } from './ladderLayout';

describe('ladderLayout', () => {
  describe('levelHeightFor', () => {
    it('returns 40 for small level counts (<=5)', () => {
      expect(levelHeightFor(1)).toBe(40);
      expect(levelHeightFor(3)).toBe(40);
      expect(levelHeightFor(5)).toBe(40);
    });

    it('interpolates linearly between 5 and 15 levels', () => {
      // At 10 levels: halfway between 5 and 15
      // 40 - ((10 - 5) / 10) * 15 = 40 - 7.5 = 32.5
      const mid = levelHeightFor(10);
      expect(mid).toBe(32.5);

      // At 7 levels: 0.2 of the way from 5 to 15
      // 40 - ((7 - 5) / 10) * 15 = 40 - 3 = 37
      expect(levelHeightFor(7)).toBe(37);

      // At 12 levels: 0.7 of the way from 5 to 15
      // 40 - ((12 - 5) / 10) * 15 = 40 - 10.5 = 29.5
      expect(levelHeightFor(12)).toBe(29.5);
    });

    it('clamps at 25 for high level counts (>15)', () => {
      expect(levelHeightFor(16)).toBe(25);
      expect(levelHeightFor(20)).toBe(25);
      expect(levelHeightFor(100)).toBe(25);
    });

    it('returns monotonically decreasing values as numLevels increases', () => {
      let prev = levelHeightFor(1);
      for (let i = 2; i <= 50; i++) {
        const current = levelHeightFor(i);
        expect(current).toBeLessThanOrEqual(prev);
        prev = current;
      }
    });
  });

  describe('traceDurationMs', () => {
    it('returns 0 when reducedMotion is true', () => {
      expect(traceDurationMs(5, true)).toBe(0);
      expect(traceDurationMs(10, true)).toBe(0);
      expect(traceDurationMs(100, true)).toBe(0);
    });

    it('calculates duration as perLevel * numLevels when reducedMotion is false', () => {
      // 5 levels * 50ms/level = 250ms, clamped to min 280
      expect(traceDurationMs(5, false)).toBe(280);

      // 6 levels * 50ms/level = 300ms
      expect(traceDurationMs(6, false)).toBe(300);

      // 10 levels * 50ms/level = 500ms
      expect(traceDurationMs(10, false)).toBe(500);

      // 20 levels * 50ms/level = 1000ms
      expect(traceDurationMs(20, false)).toBe(1000);
    });

    it('clamps maximum at 1400ms', () => {
      // 28 levels * 50ms = 1400ms (exactly at max)
      expect(traceDurationMs(28, false)).toBe(1400);

      // 30 levels * 50ms = 1500ms, clamped to 1400
      expect(traceDurationMs(30, false)).toBe(1400);

      // 100 levels * 50ms = 5000ms, clamped to 1400
      expect(traceDurationMs(100, false)).toBe(1400);
    });

    it('clamps minimum at 280ms', () => {
      // 1 level * 50ms = 50ms, clamped to 280
      expect(traceDurationMs(1, false)).toBe(280);

      // 4 levels * 50ms = 200ms, clamped to 280
      expect(traceDurationMs(4, false)).toBe(280);

      // 5 levels * 50ms = 250ms, clamped to 280
      expect(traceDurationMs(5, false)).toBe(280);
    });

    it('returns proportional values in the middle range', () => {
      // 6 levels: 300ms (above min)
      expect(traceDurationMs(6, false)).toBe(300);

      // 12 levels: 600ms
      expect(traceDurationMs(12, false)).toBe(600);

      // 24 levels: 1200ms
      expect(traceDurationMs(24, false)).toBe(1200);
    });
  });
});
