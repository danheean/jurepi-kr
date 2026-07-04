import type { Option } from './schema';

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
 * CRITICAL FAIRNESS: Pick a random option index weighted by option.weight.
 * Strategy: cumulative sum of weights, then binary search (or linear scan for small N).
 * Each option has probability = weight / totalWeight, independent of order.
 *
 * @param options array of Option with label and weight
 * @param rng optional RNG function; defaults to cryptoRng
 * @returns index of selected option
 */
export function fairWeightedPick(options: Option[], rng: Rng = cryptoRng): number {
  if (options.length === 0) {
    return 0; // edge case; should not happen in real usage
  }

  // Compute total weight
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight === 0) {
    return 0; // fallback edge case
  }

  // Generate random float in [0, totalWeight)
  const pick = rng() * totalWeight;

  // Linear scan to find the slice
  let cumulative = 0;
  for (let i = 0; i < options.length; i++) {
    cumulative += options[i].weight;
    if (pick < cumulative) {
      return i;
    }
  }

  // Numerical precision edge case: return last option
  return options.length - 1;
}
