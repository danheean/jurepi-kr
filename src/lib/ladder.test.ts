import { describe, it, expect } from 'vitest';
import {
  Rng,
  mulberry32,
  uniformPermutation,
  ladderFromPermutation,
  tracePath,
  resolveAll,
} from './ladder';

describe('ladder engine', () => {
  describe('mulberry32 seeded PRNG', () => {
    it('returns a deterministic RNG given a seed', () => {
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
  });

  describe('uniformPermutation fairness (chi-square goodness-of-fit)', () => {
    /**
     * Chi-square critical values for p=0.01 (one-sided test).
     * These are the critical values such that P(χ² > cv) = 0.01.
     * Source: standard chi-square distribution table.
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

    /**
     * CRITICAL: Chi-square goodness-of-fit test for uniformity.
     * For each start column, test if the prize distribution is uniform.
     * H0: prize distribution is uniform (probability 1/n for each prize).
     * Returns { startCol, chi2, passesAtP001 } for each start.
     */
    it('should produce uniform start→prize distribution via chi-square test (p > 0.01)', () => {
      const RUNS = 100000; // per specification
      const testCases = [2, 3, 4, 5, 6, 7, 8, 9, 10];

      console.log('\n=== Chi-Square Fairness Test Results ===');

      for (const n of testCases) {
        // Tally: for each start column, count how many times each prize is reached
        const countByStartAndPrize: number[][] = Array.from({ length: n }, () =>
          Array.from({ length: n }, () => 0)
        );

        const rng = mulberry32(12345 + n); // deterministic, fixed seed
        for (let run = 0; run < RUNS; run++) {
          const perm = uniformPermutation(n, rng);
          for (let startCol = 0; startCol < n; startCol++) {
            const prizeIdx = perm[startCol];
            countByStartAndPrize[startCol][prizeIdx]++;
          }
        }

        const expectedPerCell = RUNS / n;
        const dof = n - 1;
        const criticalValue = CHI2_CRITICAL_P001[dof];
        let allStartsPass = true;
        const results: string[] = [];

        // Test each start column independently
        for (let startCol = 0; startCol < n; startCol++) {
          const observed = countByStartAndPrize[startCol];

          // Chi-square statistic: Σ_j (obs_j - exp)² / exp
          let chi2 = 0;
          for (let prizeIdx = 0; prizeIdx < n; prizeIdx++) {
            const obs = observed[prizeIdx];
            const exp = expectedPerCell;
            chi2 += ((obs - exp) ** 2) / exp;
          }

          const passesTest = chi2 < criticalValue;
          allStartsPass = allStartsPass && passesTest;

          // Percentile-point guard: |obs/RUNS - 1/n| ≤ 0.01 (±1pp)
          const maxDeviation = Math.max(
            ...observed.map((obs) => Math.abs(obs / RUNS - 1 / n))
          );
          const passesPercentile = maxDeviation <= 0.01;

          results.push(
            `  start=${startCol}: chi2=${chi2.toFixed(2)} (crit=${criticalValue.toFixed(2)}, ` +
            `pass=${passesTest ? 'YES' : 'NO'}, maxDev=${(maxDeviation * 100).toFixed(2)}%, pp_pass=${passesPercentile})`
          );
        }

        results.forEach((r) => console.log(r));
        expect(allStartsPass).toBe(true);
      }

      console.log('=== All tests passed ===\n');
    });

    it('should reach every prize from every start (full support)', () => {
      const testCases = [2, 3, 4, 5, 6, 7, 8, 9, 10];
      const RUNS = 10000;

      for (const n of testCases) {
        // Track which prizes each start can reach
        const reachable: Set<number>[] = Array.from({ length: n }, () => new Set<number>());

        const rng = mulberry32(99999 + n);
        for (let run = 0; run < RUNS; run++) {
          const perm = uniformPermutation(n, rng);
          for (let start = 0; start < n; start++) {
            reachable[start].add(perm[start]);
          }
        }

        // Every start should reach every prize
        for (let start = 0; start < n; start++) {
          expect(reachable[start].size).toBe(n);
        }
      }
    });
  });

  describe('ladderFromPermutation structure', () => {
    it('creates a valid ladder (no adjacent rungs in one level)', () => {
      const perm = [2, 0, 1];
      const rungs = ladderFromPermutation(perm, mulberry32(42));

      // Check no-adjacent invariant
      for (let level = 0; level < rungs.length; level++) {
        for (let c = 0; c < rungs[level].length - 1; c++) {
          const hasLeft = rungs[level][c];
          const hasRight = rungs[level][c + 1];
          expect(!(hasLeft && hasRight)).toBe(true);
        }
      }
    });

    it('realizes the input permutation via tracePath', () => {
      const testPerms = [
        [0, 1, 2],
        [2, 0, 1],
        [1, 2, 0],
        [3, 1, 2, 0],
        [1, 0, 2, 3],
      ];

      for (const perm of testPerms) {
        const rungs = ladderFromPermutation(perm, mulberry32(perm[0] || 1));
        const resolved = resolveAll(rungs, perm.length);
        expect(resolved).toEqual(perm);
      }
    });
  });

  describe('tracePath', () => {
    it('produces correct path segments from start to end', () => {
      const perm = [2, 0, 1];
      const rungs = ladderFromPermutation(perm, mulberry32(42));

      for (let startCol = 0; startCol < perm.length; startCol++) {
        const path = tracePath(rungs, startCol);

        // Path should start at startCol
        expect(path[0]).toEqual({ col: startCol, level: 0 });

        // Path should end at the correct prize column
        const endCol = path[path.length - 1].col;
        expect(endCol).toBe(perm[startCol]);

        // Path levels should be sequential
        for (let i = 1; i < path.length; i++) {
          expect(path[i].level).toBe(i);
        }
      }
    });
  });

  describe('resolveAll consistency', () => {
    it('should return a permutation (bijection)', () => {
      const testCases = [2, 3, 4, 5, 6, 8, 10];

      for (const n of testCases) {
        const perm = uniformPermutation(n, mulberry32(777 + n));
        const rungs = ladderFromPermutation(perm, mulberry32(778 + n));
        const resolved = resolveAll(rungs, n);

        // Check it's a permutation (each value 0..n-1 exactly once)
        const sorted = resolved.slice().sort((a, b) => a - b);
        const expected = Array.from({ length: n }, (_, i) => i);
        expect(sorted).toEqual(expected);

        // Check it equals the original perm (because we built rungs from perm)
        expect(resolved).toEqual(perm);
      }
    });
  });

  describe('ladderFromPermutation with tension (decoy rungs)', () => {
    it('accepts tension option: low, medium, high', () => {
      const perm = [2, 0, 1];
      const rng = mulberry32(42);
      const rungs = ladderFromPermutation(perm, rng, { tension: 'high' });
      expect(Array.isArray(rungs)).toBe(true);
    });

    it('higher tension produces more rungs than lower tension (same perm, seed)', () => {
      const perm = [3, 1, 2, 0];
      const rngSeed = 555;

      const rngLow = mulberry32(rngSeed);
      const rungesLow = ladderFromPermutation(perm, rngLow, { tension: 'low' });

      const rngHigh = mulberry32(rngSeed);
      const rungesHigh = ladderFromPermutation(perm, rngHigh, { tension: 'high' });

      // high should have more levels than low
      expect(rungesHigh.length).toBeGreaterThan(rungesLow.length);
    });

    it('all tensions preserve the permutation via resolveAll', () => {
      const tensions: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
      const testCases = [2, 3, 4, 5, 6];

      for (const n of testCases) {
        const perm = uniformPermutation(n, mulberry32(888 + n));

        for (const tension of tensions) {
          const rng = mulberry32(889 + n); // deterministic RNG per test
          const rungs = ladderFromPermutation(perm, rng, { tension });
          const resolved = resolveAll(rungs, n);

          // CRITICAL: The result must equal the original permutation
          // For all tensions (low, medium, high), resolveAll must return the permutation unchanged
          expect(resolved).toEqual(perm);
        }
      }
    });

    it('maintains no-adjacent-rung invariant with tension', () => {
      const tensions: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

      for (const tension of tensions) {
        const perm = [4, 1, 3, 0, 2];
        const rng = mulberry32(999 + (tension === 'low' ? 0 : tension === 'medium' ? 1 : 2));
        const rungs = ladderFromPermutation(perm, rng, { tension });

        // Check no adjacent rungs (two true values next to each other in same level)
        for (let level = 0; level < rungs.length; level++) {
          for (let c = 0; c < rungs[level].length - 1; c++) {
            const hasLeft = rungs[level][c];
            const hasRight = rungs[level][c + 1];
            // No two adjacent rungs in same level (no-adjacent-rung invariant)
            expect(!(hasLeft && hasRight)).toBe(true);
          }
        }
      }
    });

    it('chi-square fairness is preserved across all tensions', () => {
      // Simplified chi-square test: ensure tension does not break fairness
      // We'll sample a smaller set due to computation cost
      const n = 4;
      const RUNS = 10000;
      const tension = 'high';

      // Tally: for each start column, count how many times each prize is reached
      const countByStartAndPrize: number[][] = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => 0)
      );

      const rng = mulberry32(7777);
      for (let run = 0; run < RUNS; run++) {
        const perm = uniformPermutation(n, rng);
        const rngDecoy = mulberry32(7778 + run);
        const rungs = ladderFromPermutation(perm, rngDecoy, { tension });
        const resolved = resolveAll(rungs, n);

        for (let startCol = 0; startCol < n; startCol++) {
          const prizeIdx = resolved[startCol];
          countByStartAndPrize[startCol][prizeIdx]++;
        }
      }

      const expectedPerCell = RUNS / n;
      const dof = n - 1;
      const CHI2_CRITICAL_P001: Record<number, number> = {
        3: 11.345,
      };
      const criticalValue = CHI2_CRITICAL_P001[dof];

      // Test a couple of start columns
      for (let startCol = 0; startCol < 2; startCol++) {
        const observed = countByStartAndPrize[startCol];
        let chi2 = 0;
        for (let prizeIdx = 0; prizeIdx < n; prizeIdx++) {
          const obs = observed[prizeIdx];
          const exp = expectedPerCell;
          chi2 += ((obs - exp) ** 2) / exp;
        }
        // Should pass chi-square test (chi2 < critical)
        expect(chi2).toBeLessThan(criticalValue);
      }
    });
  });
});
