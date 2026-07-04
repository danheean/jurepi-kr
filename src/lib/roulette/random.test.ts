import { describe, it, expect } from 'vitest';
import {
  Rng,
  mulberry32,
  fairWeightedPick,
  cryptoRng,
} from './random';
import type { Option } from './schema';

describe('random.ts', () => {
  describe('mulberry32 seeded PRNG', () => {
    it('returns deterministic sequence for same seed', () => {
      const rng1 = mulberry32(42);
      const vals1 = Array.from({ length: 10 }, () => rng1());

      const rng2 = mulberry32(42);
      const vals2 = Array.from({ length: 10 }, () => rng2());

      expect(vals1).toEqual(vals2);
    });

    it('produces values in [0, 1)', () => {
      const rng = mulberry32(123);
      for (let i = 0; i < 1000; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('returns different sequences for different seeds', () => {
      const rng1 = mulberry32(1);
      const vals1 = Array.from({ length: 10 }, () => rng1());

      const rng2 = mulberry32(2);
      const vals2 = Array.from({ length: 10 }, () => rng2());

      expect(vals1).not.toEqual(vals2);
    });
  });

  describe('fairWeightedPick basic behavior', () => {
    it('returns a valid index', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
        { label: 'C', weight: 1 },
      ];
      const rng = mulberry32(42);
      const index = fairWeightedPick(options, rng);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(options.length);
    });

    it('returns valid indices for 2 options', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
      ];
      const rng = mulberry32(999);
      for (let i = 0; i < 100; i++) {
        const index = fairWeightedPick(options, rng);
        expect([0, 1]).toContain(index);
      }
    });

    it('handles weighted options', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
        { label: 'C', weight: 3 },
      ];
      const rng = mulberry32(77);
      for (let i = 0; i < 100; i++) {
        const index = fairWeightedPick(options, rng);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(3);
      }
    });

    it('handles single option gracefully', () => {
      const options: Option[] = [{ label: 'A', weight: 1 }];
      const rng = mulberry32(88);
      const index = fairWeightedPick(options, rng);
      expect(index).toBe(0);
    });

    it('defaults to cryptoRng if not provided', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
      ];
      // Just verify it returns a valid index (can't test crypto directly in unit test)
      const index = fairWeightedPick(options);
      expect([0, 1]).toContain(index);
    });
  });

  describe('fairWeightedPick chi-square fairness test', () => {
    /**
     * Chi-square critical values for p=0.01 (right-tailed test).
     * P(χ² > cv) = 0.01
     */
    const CHI2_CRITICAL_P001: Record<number, number> = {
      1: 6.635,
      2: 9.210,
      3: 11.345,
      4: 13.277,
      5: 15.086,
      6: 16.812,
      7: 18.475,
      8: 20.090,
      9: 21.666,
    };

    it('should produce uniform distribution for equal weights (chi-square test p > 0.01)', () => {
      const testCases = [2, 3, 4, 5, 6];
      const RUNS = 100000;

      console.log('\n=== Fair Weighted Pick Chi-Square Test (Equal Weights) ===');

      for (const n of testCases) {
        const options: Option[] = Array.from({ length: n }, (_, i) => ({
          label: `Option ${i}`,
          weight: 1,
        }));

        // Tally how many times each option is picked
        const counts = Array.from({ length: n }, () => 0);
        const rng = mulberry32(12345 + n);

        for (let run = 0; run < RUNS; run++) {
          const idx = fairWeightedPick(options, rng);
          counts[idx]++;
        }

        // Chi-square calculation: Σ(obs - exp)² / exp
        const expectedPerBin = RUNS / n;
        let chi2 = 0;
        for (let i = 0; i < n; i++) {
          const obs = counts[i];
          chi2 += ((obs - expectedPerBin) ** 2) / expectedPerBin;
        }

        const dof = n - 1;
        const criticalValue = CHI2_CRITICAL_P001[dof];
        const passes = chi2 < criticalValue;

        console.log(
          `  n=${n}: chi2=${chi2.toFixed(2)} (crit=${criticalValue.toFixed(2)}, pass=${passes ? 'YES' : 'NO'})`
        );
        expect(passes).toBe(true);
      }

      console.log('=== All chi-square tests passed ===\n');
    });

    it('should respect weighted ratios (chi-square test p > 0.01)', () => {
      const RUNS = 100000;
      const n = 3;

      // Options with weights 1:2:3
      const options: Option[] = [
        { label: 'Light', weight: 1 },
        { label: 'Medium', weight: 2 },
        { label: 'Heavy', weight: 3 },
      ];

      const counts = Array.from({ length: n }, () => 0);
      const rng = mulberry32(54321);

      for (let run = 0; run < RUNS; run++) {
        const idx = fairWeightedPick(options, rng);
        counts[idx]++;
      }

      // Expected distribution: 1/6, 2/6, 3/6
      const totalWeight = 1 + 2 + 3; // 6
      const expectedCounts = [
        (RUNS * 1) / totalWeight,
        (RUNS * 2) / totalWeight,
        (RUNS * 3) / totalWeight,
      ];

      // Chi-square test with expected values weighted by ratio
      let chi2 = 0;
      for (let i = 0; i < n; i++) {
        const obs = counts[i];
        const exp = expectedCounts[i];
        chi2 += ((obs - exp) ** 2) / exp;
      }

      const dof = n - 1;
      const criticalValue = CHI2_CRITICAL_P001[dof];
      const passes = chi2 < criticalValue;

      console.log(
        `\n=== Weighted Distribution Test (1:2:3) ===`
      );
      console.log(
        `  Observed counts: ${counts.map((c) => c).join(', ')}`
      );
      console.log(
        `  Expected counts: ${expectedCounts.map((e) => e.toFixed(0)).join(', ')}`
      );
      console.log(
        `  chi2=${chi2.toFixed(2)} (crit=${criticalValue.toFixed(2)}, pass=${passes ? 'YES' : 'NO'})`
      );

      expect(passes).toBe(true);
    });

    it('should reach all options with high weight (coverage test)', () => {
      const testCases = [2, 3, 4, 5];

      for (const n of testCases) {
        const options: Option[] = Array.from({ length: n }, (_, i) => ({
          label: `Option ${i}`,
          weight: 1,
        }));

        const reached = new Set<number>();
        const rng = mulberry32(99999 + n);

        for (let run = 0; run < 10000; run++) {
          const idx = fairWeightedPick(options, rng);
          reached.add(idx);
        }

        // All options should be reachable
        expect(reached.size).toBe(n);
      }
    });
  });
});
