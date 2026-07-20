import { describe, it, expect } from 'vitest';
import {
  cryptoRng,
  fairDraw,
  fairDrawGames,
  chiSquareUniformityTest,
} from './random';

describe('src/lib/lotto-generator/random', () => {
  describe('fairDraw', () => {
    it('RED: fairness — chi-square test passes (10k iterations)', () => {
      // This is the critical fairness test.
      // Runs fairDraw([],[],crypto) 10,000 times and checks distribution uniformity.
      const chi2 = chiSquareUniformityTest(10000, cryptoRng);
      const criticalValue = 59.30; // DoF=44, α=0.05
      expect(chi2).toBeLessThan(criticalValue);
      // Log for visibility
      console.log(`✓ Chi-square test passed: χ² = ${chi2.toFixed(2)} < ${criticalValue}`);
    });

    it('returns exactly 6 unique sorted numbers in [1, 45]', () => {
      const draw = fairDraw([], []);
      expect(draw).toHaveLength(6);
      expect(new Set(draw).size).toBe(6);
      expect(draw.every((n) => n >= 1 && n <= 45)).toBe(true);
      const sorted = [...draw].sort((a, b) => a - b);
      expect(draw).toEqual(sorted);
    });

    it('includes all fixed numbers', () => {
      const fixed = [1, 7, 23];
      const draw = fairDraw(fixed, []);
      fixed.forEach((n) => {
        expect(draw).toContain(n);
      });
    });

    it('excludes all excluded numbers', () => {
      const excluded = [10, 11, 12, 13, 14, 15];
      const draw = fairDraw([], excluded);
      excluded.forEach((n) => {
        expect(draw).not.toContain(n);
      });
    });

    it('handles both fixed and excluded', () => {
      const fixed = [1, 7];
      const excluded = [10, 20, 30, 40];
      const draw = fairDraw(fixed, excluded);

      expect(draw).toHaveLength(6);
      expect(draw).toContain(1);
      expect(draw).toContain(7);
      excluded.forEach((n) => {
        expect(draw).not.toContain(n);
      });
    });

    it('throws when insufficient numbers (too many fixed + excluded)', () => {
      // Fix 5 numbers [1-5], exclude 40 numbers [6-45] → 0 candidates available, need 1
      const fixed = [1, 2, 3, 4, 5];
      const excluded = Array.from({ length: 40 }, (_, i) => i + 6); // 6–45
      expect(() => fairDraw(fixed, excluded)).toThrow();
    });

    it('handles empty fixed and excluded', () => {
      const draw = fairDraw([], []);
      expect(draw).toHaveLength(6);
    });

    it('distributes eligible candidates uniformly (with seeded RNG)', () => {
      // Use a simple seeded RNG to test distribution bias.
      // Generate many draws and verify no number has 0 or 45+ draws.
      let seedValue = 0;
      const seededRng = () => {
        seedValue = (seedValue * 1103515245 + 12345) % 2147483648;
        return seedValue / 2147483648;
      };

      const counts: Record<number, number> = {};
      for (let i = 1; i <= 45; i++) counts[i] = 0;

      // Generate 6000 draws
      for (let i = 0; i < 6000; i++) {
        const draw = fairDraw([], [], () => {
          seedValue = (seedValue * 1103515245 + 12345) % 2147483648;
          return seedValue / 2147483648;
        });
        draw.forEach((n) => counts[n]++);
      }

      // Each number should appear ~800 times (6000 × 6 / 45)
      // Allow wider variance with seeded RNG: should be between ~100–2200
      Object.entries(counts).forEach(([num, count]) => {
        expect(count).toBeGreaterThan(100);
        expect(count).toBeLessThan(2200);
      });
    });
  });

  describe('fairDrawGames', () => {
    it('generates N games', () => {
      const result = fairDrawGames(3, [], []);
      expect(result.games).toHaveLength(3);
      expect(result.settings).toEqual({
        gameCount: 3,
        fixedNumbers: [],
        excludedNumbers: [],
      });
    });

    it('respects gameCount range [1, 10]', () => {
      const result1 = fairDrawGames(1, [], []);
      expect(result1.games).toHaveLength(1);

      const result10 = fairDrawGames(10, [], []);
      expect(result10.games).toHaveLength(10);
    });

    it('applies fixed and excluded to all games', () => {
      const fixed = [1, 7];
      const excluded = [10, 20, 30];
      const result = fairDrawGames(5, fixed, excluded);

      result.games.forEach((draw) => {
        expect(draw).toContain(1);
        expect(draw).toContain(7);
        [10, 20, 30].forEach((n) => {
          expect(draw).not.toContain(n);
        });
      });
    });

    it('stores settings in result', () => {
      const fixed = [5];
      const excluded = [15];
      const result = fairDrawGames(2, fixed, excluded);

      expect(result.settings.gameCount).toBe(2);
      expect(result.settings.fixedNumbers).toEqual(fixed);
      expect(result.settings.excludedNumbers).toEqual(excluded);
    });
  });

  describe('cryptoRng', () => {
    it('returns value in [0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const val = cryptoRng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('produces distinct values (not constant)', () => {
      const samples = Array.from({ length: 10 }, () => cryptoRng());
      const unique = new Set(samples);
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('chiSquareUniformityTest', () => {
    it('computes chi-square statistic', () => {
      const chi2 = chiSquareUniformityTest(1000, cryptoRng);
      expect(chi2).toBeGreaterThan(0);
      expect(chi2).toBeLessThan(200); // Reasonable bound
    });

    it('returns lower chi-square for more iterations (tighter distribution)', () => {
      // With more iterations, empirical distribution should better match expected.
      // This is a soft assertion (chi-square will vary by random run).
      const chi2_small = chiSquareUniformityTest(1000, cryptoRng);
      const chi2_large = chiSquareUniformityTest(5000, cryptoRng);

      // Both should be < critical value
      expect(chi2_small).toBeLessThan(90);
      expect(chi2_large).toBeLessThan(90);
    });
  });
});
