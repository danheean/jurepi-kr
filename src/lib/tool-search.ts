import type { ToolCategory, AccentColor } from '@/tools/types';

/**
 * A tool with localized name, description, and searchable metadata.
 * Used as the common contract between registry + UI layer.
 */
export interface SearchableTool {
  id: string;
  slug: string;
  category: ToolCategory;
  accent: AccentColor;
  icon: string;
  status: 'live' | 'coming_soon';
  /** Release date (ISO YYYY-MM-DD) */
  addedAt: string;
  /** Derived at build time from addedAt (see isNewTool) */
  isNew?: boolean;
  isPopular?: boolean;
  order: number;
  keywords: string[];
  /** Localized at render time from messages */
  name: string;
  description: string;
}

/**
 * Case-insensitive substring match over name, description, keywords.
 * Empty query returns true (matches all).
 * Trims query; handles ko/en seamlessly.
 */
export function matchTool(tool: SearchableTool, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.keywords.some(kw => kw.toLowerCase().includes(q))
  );
}

/**
 * Filter by query + optional category.
 * Returns new array (immutable).
 */
export interface FilterOptions {
  query?: string;
  category?: ToolCategory | 'all';
}

export function filterTools(
  tools: SearchableTool[],
  opts: FilterOptions
): SearchableTool[] {
  return tools.filter(tool => {
    const matchesQuery = matchTool(tool, opts.query || '');
    const matchesCat =
      !opts.category ||
      opts.category === 'all' ||
      tool.category === opts.category;
    return matchesQuery && matchesCat;
  });
}

/**
 * Sort: isPopular DESC → order ASC → coming_soon last.
 * Returns new array (immutable).
 */
export function sortTools(tools: SearchableTool[]): SearchableTool[] {
  return [...tools].sort((a, b) => {
    // Popular first
    if (a.isPopular !== b.isPopular)
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    // Live before coming_soon
    if (a.status !== b.status)
      return (a.status === 'coming_soon' ? 1 : 0) -
        (b.status === 'coming_soon' ? 1 : 0);
    // Order ascending
    if (a.order !== b.order) return a.order - b.order;
    return 0;
  });
}

/**
 * Category option for filter pills.
 * Naming fix: separate from the union type ToolCategory to avoid collision.
 */
export interface CategoryOption {
  id: ToolCategory | 'all';
  labelKey: string; // e.g. 'categories.all', 'categories.random'
}

/**
 * Stable sort order for categories: all → random → calculator → text → converter → fun → mindset → dev → news.
 */
export const CATEGORY_ORDER: Array<ToolCategory | 'all'> = [
  'all',
  'random',
  'calculator',
  'text',
  'converter',
  'fun',
  'mindset',
  'dev',
  'news',
];

/**
 * Derive unique categories present in the tool list.
 * Order: random → calculator → text → converter → fun (stable per DESIGN.md).
 * Always includes "all" as the first pill.
 */
export function deriveCategories(tools: SearchableTool[]): CategoryOption[] {
  const present = new Set(tools.map(t => t.category));
  return CATEGORY_ORDER.filter(cat => cat === 'all' || present.has(cat)).map(
    cat => ({
      id: cat,
      labelKey: cat === 'all' ? 'categories.all' : `categories.${cat}`,
    })
  );
}

/** Days a tool counts as "new" after release (NEW badge window). */
export const NEW_BADGE_WINDOW_DAYS = 7;

/**
 * Max tools that may show the NEW badge at once. The window alone floods the
 * grid when several tools ship in one burst (every card reads "NEW", so the
 * signal dies); capping to the few most-recent keeps NEW meaningful.
 */
export const NEW_BADGE_MAX_COUNT = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether a tool released on `addedAt` is still "new" at `referenceDate`.
 * Both dates are ISO `YYYY-MM-DD` strings (UTC midnight comparison — locale-independent).
 * New = 0 ≤ age < windowDays. Missing/malformed/future dates → false (no badge, deterministic).
 */
export function isNewTool(
  addedAt: string,
  referenceDate: string | undefined,
  windowDays: number = NEW_BADGE_WINDOW_DAYS
): boolean {
  if (!referenceDate || !ISO_DATE.test(addedAt) || !ISO_DATE.test(referenceDate)) {
    return false;
  }
  const ageDays = (Date.parse(referenceDate) - Date.parse(addedAt)) / MS_PER_DAY;
  return ageDays >= 0 && ageDays < windowDays;
}
