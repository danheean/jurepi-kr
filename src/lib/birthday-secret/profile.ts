import { parseMonthDay } from './date';
import { flowerByDay, colorByDay, stoneByMonth } from './catalog';
import type { BirthdayCatalog, BirthProfile } from './schema';

/**
 * Build a complete birth profile from MM-DD key
 * Returns null if key is invalid or any required data is missing
 */
export function buildProfile(catalog: BirthdayCatalog, key: string): BirthProfile | null {
  // Parse and validate the key
  const parsed = parseMonthDay(key);
  if (!parsed) return null;

  const { month } = parsed;

  // Lookup required data
  const flower = flowerByDay(catalog, key);
  if (!flower) return null;

  const color = colorByDay(catalog, key);
  if (!color) return null;

  const stone = stoneByMonth(catalog, month);
  if (!stone) return null;

  // Build and return the profile
  return {
    date: key,
    month,
    flower,
    color,
    stone,
  };
}
