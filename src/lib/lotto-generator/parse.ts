/**
 * Parse a raw user string into a list of valid lottery numbers.
 *
 * Splits on any run of non-digit characters (commas, spaces, etc.), so
 * "7, 13, 21", "7 13 21" and "7,13" all work. Keeps only integers within
 * [min, max], removes duplicates, and preserves first-seen order.
 *
 * Pure function — no framework/DOM dependencies.
 */
export function parseNumberList(raw: string, min: number, max: number): number[] {
  const seen = new Set<number>();
  const result: number[] = [];

  for (const token of raw.split(/[^0-9]+/)) {
    if (token === '') continue;
    const n = Number.parseInt(token, 10);
    if (Number.isNaN(n) || n < min || n > max || seen.has(n)) continue;
    seen.add(n);
    result.push(n);
  }

  return result;
}
