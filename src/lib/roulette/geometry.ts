import type { Option } from './schema';

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
