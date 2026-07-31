import type { Locale } from './schema';

/**
 * Build Google Images search URL for a query
 */
export function googleImageUrl(query: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
}

/**
 * Build otanjoubi.jp URL with month and day
 */
export function otanjoubiUrl(month: number, day: number): string {
  return `https://otanjoubi.jp/ko/select.php?month=${month}&day=${day}`;
}

/**
 * Build lunar converter tool URL for the given locale
 */
export function converterUrl(locale: Locale): string {
  return `/${locale}/tools/lunar-converter`;
}
