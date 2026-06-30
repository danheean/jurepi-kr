/**
 * Pure theme preference resolution — no React, no DOM, no side effects.
 */

export type ThemePref = 'light' | 'dark' | 'system';

/**
 * Resolve a theme preference to a concrete value.
 * @param pref - User preference from localStorage or default.
 * @param systemPrefersDark - Result of matchMedia('(prefers-color-scheme:dark)').matches.
 * @returns Concrete 'light' or 'dark'.
 */
export function resolveTheme(
  pref: ThemePref,
  systemPrefersDark: boolean
): 'light' | 'dark' {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  // pref === 'system'
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * Type guard: is unknown value a valid ThemePref?
 */
export function isThemePref(v: unknown): v is ThemePref {
  return v === 'light' || v === 'dark' || v === 'system';
}

/**
 * Default preference.
 */
export const DEFAULT_THEME_PREF: ThemePref = 'light';
