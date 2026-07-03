import type { Zodiac } from './schema';

/**
 * Korean Zodiac: 12-year animal cycle based on earthly branches.
 * Pure computation: branch index = (year - 4) % 12
 * Returns lowercase stable keys for i18n mapping.
 */

const ZODIAC_ANIMALS = [
  { key: 'rat', emoji: '🐀' },
  { key: 'ox', emoji: '🐂' },
  { key: 'tiger', emoji: '🐯' },
  { key: 'rabbit', emoji: '🐰' },
  { key: 'dragon', emoji: '🐉' },
  { key: 'snake', emoji: '🐍' },
  { key: 'horse', emoji: '🐴' },
  { key: 'goat', emoji: '🐑' },
  { key: 'monkey', emoji: '🐵' },
  { key: 'rooster', emoji: '🐓' },
  { key: 'dog', emoji: '🐕' },
  { key: 'pig', emoji: '🐷' },
] as const;

/**
 * Compute zodiac animal for a given year.
 * Formula: branchIndex = (year - 4) % 12
 * Returns lowercase key and emoji for the corresponding animal.
 */
export function computeZodiac(year: number): Zodiac {
  const branchIndex = ((year - 4) % 12 + 12) % 12;
  const animal = ZODIAC_ANIMALS[branchIndex];

  return {
    key: animal.key,
    emoji: animal.emoji,
    branchIndex,
  };
}
