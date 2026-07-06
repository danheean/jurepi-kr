import type { Option } from './schema';
import {
  SPIN_MIN_FULL_TURNS,
  SPIN_MAX_FULL_TURNS,
  SPIN_DURATION_MIN_MS,
  SPIN_DURATION_MAX_MS,
} from './schema';

/**
 * Information about a single slice in the roulette wheel.
 */
export interface SliceInfo {
  angle: number; // start angle in degrees, [0, 360)
  span: number; // arc width in degrees
  midAngle: number; // rotation for radial label, [0, 360)
}

/**
 * Calculate the angle (in degrees) spanned by a single slice.
 * @param weight the weight of this option
 * @param totalWeight sum of all option weights
 * @returns angle in degrees, e.g., 90 for 1/4 of the wheel
 */
export function sliceAngle(weight: number, totalWeight: number): number {
  return (weight / totalWeight) * 360;
}

/**
 * Build slice geometry for all options.
 * Slices are positioned sequentially around the wheel, 0..360 degrees.
 * Each slice's midAngle is the center of the arc, used for radial text positioning.
 *
 * @param options array of Option with label and weight
 * @returns array of SliceInfo, one per option, in order
 */
export function buildSliceGeometry(options: Option[]): SliceInfo[] {
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight === 0 || options.length === 0) {
    return [];
  }

  const slices: SliceInfo[] = [];
  let currentAngle = 0;

  for (const opt of options) {
    const span = sliceAngle(opt.weight, totalWeight);
    const midAngle = (currentAngle + span / 2) % 360;

    slices.push({
      angle: currentAngle,
      span,
      midAngle,
    });

    currentAngle = (currentAngle + span) % 360;
  }

  return slices;
}

/**
 * Calculate the final rotation angle to position a winner at the top (0°).
 * CRITICAL: After this rotation, the winner's midAngle should point to 0°.
 *
 * @param selectedIndex index of the winning option
 * @param slices array of SliceInfo from buildSliceGeometry
 * @returns rotation angle in degrees, [0, 360)
 */
export function finalSpinAngle(selectedIndex: number, slices: SliceInfo[]): number {
  if (selectedIndex < 0 || selectedIndex >= slices.length) {
    return 0;
  }

  const winnerMidAngle = slices[selectedIndex].midAngle;

  // To move midAngle to 0°, we rotate by (360 - midAngle) % 360
  // Example: midAngle = 90 → rotate by 270 (so 90 + 270 = 360 ≡ 0)
  const finalAngle = (360 - winnerMidAngle) % 360;

  return finalAngle;
}

/**
 * A concrete plan for one spin animation.
 */
export interface SpinPlan {
  /** Cumulative rotation (degrees) the wheel should animate to. Strictly > currentRotation. */
  targetRotation: number;
  /** Animation duration in ms, randomized within [SPIN_DURATION_MIN_MS, SPIN_DURATION_MAX_MS]. */
  durationMs: number;
}

/**
 * Build a spin plan from the current cumulative rotation to a landing angle.
 *
 * The wheel always spins FORWARD by SPIN_MIN..MAX full turns plus the delta
 * needed to land on finalAngle — so even when the same winner is picked twice
 * in a row (delta 0), the wheel visibly spins. Duration is randomized so the
 * reveal moment cannot be predicted.
 *
 * @param currentRotation cumulative rotation the wheel is currently at (degrees)
 * @param finalAngle landing angle in [0, 360) from finalSpinAngle()
 * @param rng random source in [0, 1) — injectable for deterministic tests
 */
export function buildSpinPlan(
  currentRotation: number,
  finalAngle: number,
  rng: () => number = Math.random
): SpinPlan {
  const turnRange = SPIN_MAX_FULL_TURNS - SPIN_MIN_FULL_TURNS + 1;
  const fullTurns = SPIN_MIN_FULL_TURNS + Math.floor(rng() * turnRange);

  const durationMs = Math.round(
    SPIN_DURATION_MIN_MS + rng() * (SPIN_DURATION_MAX_MS - SPIN_DURATION_MIN_MS)
  );

  const currentMod = ((currentRotation % 360) + 360) % 360;
  const delta = (((finalAngle - currentMod) % 360) + 360) % 360;

  return {
    targetRotation: currentRotation + fullTurns * 360 + delta,
    durationMs,
  };
}
