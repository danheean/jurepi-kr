import { LOTTO_MAX, NUMBERS_PER_GAME } from './schema';

/**
 * Check if draw constraints are feasible.
 *
 * Invariant: (45 - excludedCount) >= (6 - fixedCount)
 * This ensures there are enough valid numbers to fill the remaining slots.
 *
 * @param fixedCount - 0–5
 * @param excludedCount - 0–39
 * @returns true if constraints are feasible
 */
export function isDrawFeasible(fixedCount: number, excludedCount: number): boolean {
  const validNumbers = LOTTO_MAX - excludedCount;
  const neededNumbers = NUMBERS_PER_GAME - fixedCount;
  return validNumbers >= neededNumbers;
}

/**
 * Describe conflict if infeasible.
 *
 * @param fixedCount - 0–5
 * @param excludedCount - 0–39
 * @returns null if feasible; i18n key string otherwise
 */
export function feasibilityError(fixedCount: number, excludedCount: number): string | null {
  if (!isDrawFeasible(fixedCount, excludedCount)) {
    return 'settings.infeasible';
  }
  return null;
}
