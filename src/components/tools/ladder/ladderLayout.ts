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
