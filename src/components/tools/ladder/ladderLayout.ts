/**
 * Shared geometry for the ladder board and the chip/card rows that must align
 * to the same columns. Keeping these in one place lets PlayerHeader, PrizeCards,
 * and LadderBoard share a single source of truth (DRY).
 */

// SVG board coordinate constants (viewBox units).
export const COLUMN_WIDTH = 60;
export const LEVEL_HEIGHT = 40;
export const PADDING = 30;

// Responsive track sizing (CSS px).
// MIN_COL: minimum width per column before the track scrolls horizontally
// (the prize card is 56px, so 64 leaves a small gutter).
export const MIN_COL = 64;
// BOARD_MAX: desktop cap for the shared track width — wide enough for full names.
export const BOARD_MAX = 560;

/**
 * Center x of column `i` as a percentage of the shared track width.
 * The board's rail `i` sits at viewBox x = PADDING + i*COLUMN_WIDTH, which is
 * exactly the center of N equal-width columns: (2i+1)/(2N). Positioning chips and
 * cards at the same fraction makes them line up over each rail at any width.
 */
export const colCenterPct = (i: number, n: number): number =>
  ((2 * i + 1) / (2 * n)) * 100;

/**
 * Compute the level height based on the number of rungs.
 * For many levels, compress the board by reducing height-per-level.
 * - numLevels <= 5: 40px (default)
 * - 5 < numLevels <= 15: linear interpolation from 40 → 25
 * - numLevels > 15: 25px (minimum)
 */
export const levelHeightFor = (numLevels: number): number => {
  if (numLevels <= 5) {
    return 40;
  }
  if (numLevels <= 15) {
    // Linear from 40 (at level 5) to 25 (at level 15)
    return 40 - ((numLevels - 5) / 10) * 15;
  }
  return 25;
};

/**
 * Compute animation duration for trace based on path length.
 * - reducedMotion: 0ms (no animation)
 * - otherwise: 50ms per level, clamped to [280ms, 1400ms]
 */
export const traceDurationMs = (
  numLevels: number,
  reducedMotion: boolean
): number => {
  if (reducedMotion) {
    return 0;
  }
  const perLevelMs = 50;
  const baseDuration = numLevels * perLevelMs;
  // Clamp to reasonable bounds
  return Math.max(280, Math.min(baseDuration, 1400));
};
