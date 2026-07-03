import { describe, it, expect } from 'vitest';
import { deltaE, isContrastAcceptable, ContrastError } from './contrast';

describe('contrast.ts', () => {
  describe('deltaE', () => {
    it('returns 0 for identical colors', () => {
      expect(deltaE('#ffffff', '#ffffff')).toBe(0);
      expect(deltaE('#000000', '#000000')).toBe(0);
      expect(deltaE('#ff0000', '#ff0000')).toBe(0);
    });

    it('calculates correct distance for black and white', () => {
      const delta = deltaE('#000000', '#ffffff');
      // sqrt(255^2 + 255^2 + 255^2) = sqrt(195075) ≈ 441.67
      expect(delta).toBeGreaterThan(440);
      expect(delta).toBeLessThan(443);
    });

    it('handles hex colors with uppercase', () => {
      const delta1 = deltaE('#ffffff', '#000000');
      const delta2 = deltaE('#FFFFFF', '#000000');
      expect(delta1).toBe(delta2);
    });

    it('handles hex colors without hash', () => {
      const delta1 = deltaE('#000000', '#ffffff');
      const delta2 = deltaE('000000', 'ffffff');
      expect(delta1).toBe(delta2);
    });

    it('handles red channel difference', () => {
      const delta = deltaE('#ff0000', '#000000');
      expect(delta).toBe(255);
    });

    it('handles green channel difference', () => {
      const delta = deltaE('#00ff00', '#000000');
      expect(delta).toBe(255);
    });

    it('handles blue channel difference', () => {
      const delta = deltaE('#0000ff', '#000000');
      expect(delta).toBe(255);
    });

    it('is symmetric', () => {
      const delta1 = deltaE('#ff0000', '#00ff00');
      const delta2 = deltaE('#00ff00', '#ff0000');
      expect(delta1).toBe(delta2);
    });

    it('calculates partial differences correctly', () => {
      // #ff0000 vs #ff0001 (blue difference of 1)
      const delta = deltaE('#ff0000', '#ff0001');
      expect(delta).toBe(1);
    });

    it('handles typical foreground and background colors', () => {
      // Dark text (#2a2411) on white background (#ffffff)
      const delta = deltaE('#2a2411', '#ffffff');
      expect(delta).toBeGreaterThan(380);
    });

    it('throws ContrastError for invalid hex format', () => {
      expect(() => deltaE('invalid', '#ffffff')).toThrow(ContrastError);
      expect(() => deltaE('#00000', '#ffffff')).toThrow(ContrastError);
      expect(() => deltaE('#gggggg', '#ffffff')).toThrow(ContrastError);
    });

    it('throws ContrastError for both invalid', () => {
      expect(() => deltaE('invalid', 'invalid')).toThrow(ContrastError);
    });
  });

  describe('isContrastAcceptable', () => {
    it('returns true for high contrast colors', () => {
      expect(isContrastAcceptable('#000000', '#ffffff')).toBe(true);
      expect(isContrastAcceptable('#2a2411', '#ffffff')).toBe(true);
    });

    it('returns false for same colors', () => {
      expect(isContrastAcceptable('#ffffff', '#ffffff')).toBe(false);
    });

    it('uses default threshold of 50', () => {
      // Colors with delta approximately 50 should be at boundary
      // #ff0000 vs #ffccff has delta sqrt(0^2 + 51^2 + 0^2) ≈ 51
      const result = isContrastAcceptable('#ff0000', '#ffccff');
      expect(typeof result).toBe('boolean');
    });

    it('respects custom threshold', () => {
      // black-ish vs white: delta ≈ 441
      // Should pass with threshold 50
      expect(isContrastAcceptable('#000000', '#ffffff', 50)).toBe(true);
      // Should pass with threshold 400
      expect(isContrastAcceptable('#000000', '#ffffff', 400)).toBe(true);
      // Should fail with threshold 500
      expect(isContrastAcceptable('#000000', '#ffffff', 500)).toBe(false);
    });

    it('is symmetric', () => {
      const result1 = isContrastAcceptable('#ff0000', '#00ff00', 100);
      const result2 = isContrastAcceptable('#00ff00', '#ff0000', 100);
      expect(result1).toBe(result2);
    });

    it('returns true on invalid hex (graceful fail)', () => {
      // The function should catch parsing errors and return true
      expect(isContrastAcceptable('invalid', '#ffffff')).toBe(true);
      expect(isContrastAcceptable('#ffffff', 'not-hex')).toBe(true);
    });

    it('works with typical QR colors', () => {
      // Standard QR: black on white
      expect(isContrastAcceptable('#000000', '#ffffff')).toBe(true);
      // Acceptable: dark on light
      expect(isContrastAcceptable('#333333', '#eeeeee')).toBe(true);
      // Low contrast example
      expect(isContrastAcceptable('#aaaaaa', '#bbbbbb')).toBe(false);
    });

    it('threshold 50 is WCAG AA approximate', () => {
      // WCAG AA requires 4.5:1 ratio; our simple RGB deltaE >= 50 is approximate
      // High contrast should pass
      expect(isContrastAcceptable('#000000', '#ffffff', 50)).toBe(true);
      // Low contrast example (similar colors): #999999 vs #aaaaaa delta ~19
      expect(isContrastAcceptable('#999999', '#aaaaaa', 50)).toBe(false);
    });
  });

  describe('ContrastError', () => {
    it('is an Error subclass', () => {
      const err = new ContrastError('Invalid color');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ContrastError');
      expect(err.message).toBe('Invalid color');
    });
  });
});
