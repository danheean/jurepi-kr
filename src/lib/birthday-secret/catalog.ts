import type { BirthdayCatalog, MergedFlower, MergedColor, MergedStone, MergedMonth } from './schema';

/**
 * Find flower by MM-DD key, return null if not found
 */
export function flowerByDay(catalog: BirthdayCatalog, key: string): MergedFlower | null {
  return catalog.flowers[key] || null;
}

/**
 * Find color by MM-DD key, return null if not found
 */
export function colorByDay(catalog: BirthdayCatalog, key: string): MergedColor | null {
  return catalog.colors[key] || null;
}

/**
 * Find stone by month (1-12), return null if not found
 */
export function stoneByMonth(catalog: BirthdayCatalog, month: number): MergedStone | null {
  return catalog.stones.find((s) => s.month === month) || null;
}

/**
 * Find month by slug, return null if not found
 */
export function monthBySlug(catalog: BirthdayCatalog, slug: string): MergedMonth | null {
  return catalog.months.find((m) => m.slug === slug) || null;
}

/**
 * Return all months sorted by month number (ascending)
 */
export function allMonths(catalog: BirthdayCatalog): MergedMonth[] {
  return [...catalog.months].sort((a, b) => a.month - b.month);
}
