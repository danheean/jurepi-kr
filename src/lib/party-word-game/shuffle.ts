import type { Word } from './types';

/**
 * Xorshift32 PRNG: deterministic, seeded RNG
 * Returns next pseudorandom 32-bit integer
 */
class Xorshift32 {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is non-zero (xorshift will get stuck at 0)
    this.state = seed === 0 ? 1 : seed >>> 0;
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  /**
   * Return a random number in [0, 1)
   */
  nextFloat(): number {
    return (this.next() >>> 0) / 0x100000000;
  }

  /**
   * Return a random integer in [0, max)
   */
  nextInt(max: number): number {
    return Math.floor(this.nextFloat() * max);
  }
}

/**
 * Fair shuffle using Fisher–Yates with seeded deterministic PRNG
 * Reproducible: same seed produces same shuffle
 * No Math.random() — uses xorshift32 for reproducibility
 */
export function fairShuffle(words: Word[], seed: number): Word[] {
  const result = [...words]; // Copy to avoid mutation
  const rng = new Xorshift32(seed);

  // Fisher–Yates: iterate backward, swap with random element
  for (let i = result.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const temp = result[i];
    result[i] = result[j]!;
    result[j] = temp;
  }

  return result;
}
