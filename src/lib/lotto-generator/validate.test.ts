import { describe, it, expect } from 'vitest';
import { isDrawFeasible, feasibilityError } from './validate';

describe('src/lib/lotto-generator/validate', () => {
  describe('isDrawFeasible', () => {
    it('returns true when feasible', () => {
      expect(isDrawFeasible(0, 0)).toBe(true);
      expect(isDrawFeasible(1, 10)).toBe(true);
      expect(isDrawFeasible(5, 39)).toBe(true);
      expect(isDrawFeasible(2, 37)).toBe(true); // 45 - 37 = 8 ≥ 6 - 2 = 4 ✓
    });

    it('returns true for edge feasible cases', () => {
      expect(isDrawFeasible(5, 39)).toBe(true); // Edge: 45 - 39 = 6, need 6 - 5 = 1 ✓
      expect(isDrawFeasible(5, 40)).toBe(true); // 45 - 40 = 5, need 6 - 5 = 1 → 5 >= 1 ✓
      expect(isDrawFeasible(1, 40)).toBe(true); // 45 - 40 = 5, need 6 - 1 = 5 → 5 >= 5 ✓
      expect(isDrawFeasible(2, 40)).toBe(true); // 45 - 40 = 5, need 6 - 2 = 4 → 5 >= 4 ✓
    });

    it('returns false when insufficient numbers available', () => {
      expect(isDrawFeasible(0, 40)).toBe(false); // 45 - 40 = 5, need 6 - 0 = 6 → 5 >= 6 ✗
      expect(isDrawFeasible(5, 45)).toBe(false); // 45 - 45 = 0, need 6 - 5 = 1 → 0 >= 1 ✗
      expect(isDrawFeasible(0, 41)).toBe(false); // 45 - 41 = 4, need 6 - 0 = 6 → 4 >= 6 ✗
    });
  });

  describe('feasibilityError', () => {
    it('returns null when feasible', () => {
      expect(feasibilityError(0, 0)).toBe(null);
      expect(feasibilityError(3, 20)).toBe(null);
      expect(feasibilityError(5, 39)).toBe(null);
    });

    it('returns error key when infeasible', () => {
      const error = feasibilityError(0, 40);
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');
      expect(error).toContain('infeasible');
    });

    it('returns i18n key, not detailed message', () => {
      const error = feasibilityError(0, 45);
      expect(error).toBe('settings.infeasible');
    });
  });
});
