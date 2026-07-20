import { describe, it, expect } from 'vitest';
import { ballColor } from './colors';

describe('src/lib/lotto-generator/colors', () => {
  describe('ballColor', () => {
    it('maps 1–10 to yellow (bg-accent-sun)', () => {
      for (let i = 1; i <= 10; i++) {
        const { bgClass } = ballColor(i);
        expect(bgClass).toBe('bg-accent-sun');
      }
    });

    it('maps 11–20 to blue (bg-accent-sky)', () => {
      for (let i = 11; i <= 20; i++) {
        const { bgClass } = ballColor(i);
        expect(bgClass).toBe('bg-accent-sky');
      }
    });

    it('maps 21–30 to red (bg-accent-coral)', () => {
      for (let i = 21; i <= 30; i++) {
        const { bgClass } = ballColor(i);
        expect(bgClass).toBe('bg-accent-coral');
      }
    });

    it('maps 31–40 to gray (bg-surface-sunken)', () => {
      for (let i = 31; i <= 40; i++) {
        const { bgClass } = ballColor(i);
        expect(bgClass).toBe('bg-surface-sunken');
      }
    });

    it('maps 41–45 to green (bg-accent-mint)', () => {
      for (let i = 41; i <= 45; i++) {
        const { bgClass } = ballColor(i);
        expect(bgClass).toBe('bg-accent-mint');
      }
    });

    it('returns dark text-text on every band (WCAG AA on bright accents)', () => {
      // All accent tokens are bright/light, so dark text is the contrast-safe choice.
      [5, 15, 25, 35, 45].forEach((n) => {
        expect(ballColor(n).textClass).toBe('text-text');
      });
    });

    it('returns text-text (dark) for gray (31–40)', () => {
      for (let i = 31; i <= 40; i++) {
        const { textClass } = ballColor(i);
        expect(textClass).toBe('text-text');
      }
    });

    it('returns object with both bgClass and textClass', () => {
      const result = ballColor(7);
      expect(result).toHaveProperty('bgClass');
      expect(result).toHaveProperty('textClass');
      expect(typeof result.bgClass).toBe('string');
      expect(typeof result.textClass).toBe('string');
    });
  });
});
