/**
 * Pure, injectable ladder engine.
 * FAIRNESS FIRST: uniformPermutation chooses a uniform random permutation,
 * then ladderFromPermutation realizes that permutation visually.
 * No reliance on "random rungs" for fairness (they are biased toward center).
 */

/**
 * RNG type: function that returns a value uniformly in [0, 1).
 */
export type Rng = () => number;

/**
 * Default unbiased RNG backed by crypto.getRandomValues.
 * This is the ONLY place in the module that directly calls crypto.
 * All other functions accept an injectable rng parameter.
 */
export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / (2 ** 32);
};

/**
 * Seeded PRNG (Mulberry32) for reproducible testing and Phase 2 share links.
 * Given the same seed, produces identical sequence.
 */
export function mulberry32(seed: number): Rng {
  let m = seed;
  return () => {
    m |= 0; // type coercion to 32-bit integer
    m = (m + 0x6d2b79f5) | 0;
    let t = Math.imul(m ^ (m >>> 15), 1 | m);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // [0, 1)
  };
}

/**
 * Generate a uniformly random permutation via Fisher–Yates shuffle.
 * Each player→prize probability is exactly 1/N, independent of starting column.
 * This is the FAIRNESS-CRITICAL function.
 *
 * @param n number of players/prizes (2..10 typical)
 * @param rng optional RNG; defaults to cryptoRng
 * @returns perm where perm[startCol] = prizeIndex
 */
export function uniformPermutation(n: number, rng: Rng = cryptoRng): number[] {
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); // Fisher–Yates
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return perm;
}

/**
 * Options for ladderFromPermutation.
 */
export interface LadderFromPermutationOptions {
  tension?: 'low' | 'medium' | 'high';
}

/**
 * Build a ladder (rungs) that realizes the given permutation.
 * Strategy: decompose the permutation into adjacent transpositions via bubble sort.
 * Each transposition becomes one rung level, ensuring the no-adjacent-rung invariant.
 * Phase 2: optionally insert canceling decoy rung pairs to increase visual density.
 *
 * @param perm the target permutation (perm[startCol] = prizeIndex)
 * @param rng optional RNG (used for decoy rung insertion to ensure determinism)
 * @param opts optional configuration { tension: 'low'|'medium'|'high' }
 * @returns rungs[level][c] = true if there is a rung between columns c and c+1 at this level
 */
export function ladderFromPermutation(
  perm: number[],
  rng?: Rng,
  opts?: LadderFromPermutationOptions
): boolean[][] {
  const n = perm.length;
  const arr = perm.slice(); // work array: arr[col] = prize this column must reach
  const rungs: boolean[][] = [];

  // Bubble-sort arr to [0, 1, ..., n-1], recording each adjacent swap as a rung level
  for (let pass = 0; pass < n; pass++) {
    for (let c = 0; c < n - 1; c++) {
      if (arr[c] > arr[c + 1]) {
        // Swap arr[c] and arr[c+1]
        [arr[c], arr[c + 1]] = [arr[c + 1], arr[c]];
        // Create a level with one rung at column c
        const level = new Array(n - 1).fill(false);
        level[c] = true;
        rungs.push(level);
      }
    }
  }

  // Phase 2: optionally insert canceling decoy rung pairs for visual richness
  // Decoy pairs do NOT change the mathematical result (they are identity swaps)
  const tension = opts?.tension ?? 'high';
  if (tension !== 'low' && rng) {
    const baselineCount = rungs.length;
    const targetCount = calculateTargetRungCount(n, tension);

    if (targetCount > baselineCount) {
      const decoysToAdd = Math.floor((targetCount - baselineCount) / 2);
      insertDecoRungPairs(rungs, n, decoysToAdd, rng);
    }
  }

  return rungs;
}

/**
 * Calculate the target number of rungs based on n and tension level.
 * low: baseline (n-1), medium: ~1.5x baseline, high: ~2.5x baseline
 */
function calculateTargetRungCount(n: number, tension: 'low' | 'medium' | 'high'): number {
  const baseline = Math.max(1, n - 1);
  switch (tension) {
    case 'low':
      return baseline;
    case 'medium':
      return Math.ceil(baseline * 1.5);
    case 'high':
      return Math.ceil(baseline * 2.5);
  }
}

/**
 * Insert decoy rung pairs (non-sequential canceling swaps) at random positions.
 * Each pair consists of two adjacent levels with a rung at the same column.
 * Since they swap and swap back, they are identity and don't change the permutation.
 *
 * @param rungs the rungs array to modify (mutated in place)
 * @param n number of columns
 * @param count number of decoy pairs to insert
 * @param rng seeded RNG for reproducibility
 */
function insertDecoRungPairs(rungs: boolean[][], n: number, count: number, rng: Rng): void {
  for (let i = 0; i < count; i++) {
    // Pick a random column (0 to n-2) for the decoy pair
    const col = Math.floor(rng() * (n - 1));
    // Pick a random position to insert the pair (can be at the beginning, middle, or end)
    const insertPos = Math.floor(rng() * (rungs.length + 1));

    // Create two levels with rungs at the same column
    const level1 = new Array(n - 1).fill(false);
    level1[col] = true;
    const level2 = new Array(n - 1).fill(false);
    level2[col] = true;

    // Insert both levels together (order matters: they must be consecutive)
    rungs.splice(insertPos, 0, level1, level2);
  }
}

/**
 * Trace a path down the ladder from a starting column.
 * @param rungs the ladder structure
 * @param startCol starting column (0..n-1)
 * @returns array of { col, level } representing the path
 */
export function tracePath(
  rungs: boolean[][],
  startCol: number
): Array<{ col: number; level: number }> {
  const path: Array<{ col: number; level: number }> = [
    { col: startCol, level: 0 },
  ];
  let col = startCol;

  for (let level = 0; level < rungs.length; level++) {
    // Check if there is a rung to the right (at position [level][col])
    if (col < rungs[level].length && rungs[level][col]) {
      col += 1;
    }
    // Check if there is a rung to the left (at position [level][col-1])
    else if (col > 0 && rungs[level][col - 1]) {
      col -= 1;
    }
    // else: no rung affects this column at this level; col stays same

    path.push({ col, level: level + 1 });
  }

  return path; // last entry's col = the prize index this start column reaches
}

/**
 * Resolve all players: for each start column, determine which prize (column) it reaches.
 * Returns an array where result[startCol] = prizeIndex.
 *
 * @param rungs the ladder structure
 * @param cols number of columns (players)
 * @returns an array of length cols, representing the permutation realized by the ladder
 */
export function resolveAll(rungs: boolean[][], cols: number): number[] {
  const result: number[] = [];
  for (let startCol = 0; startCol < cols; startCol++) {
    const path = tracePath(rungs, startCol);
    const endCol = path[path.length - 1].col;
    result.push(endCol);
  }
  return result;
}
