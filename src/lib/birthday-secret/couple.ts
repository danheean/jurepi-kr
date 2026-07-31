import type { BirthProfile } from './schema';

export interface CoupleView {
  a: BirthProfile;
  b: BirthProfile;
  palette: string[]; // Deduplicated hex colors
  sameMonth: boolean;
}

/**
 * Build a couple view combining two birth profiles
 */
export function buildCoupleView(a: BirthProfile, b: BirthProfile): CoupleView {
  // Deduplicate palette colors
  const uniqueColors = Array.from(new Set([a.color.hex, b.color.hex]));

  return {
    a,
    b,
    palette: uniqueColors,
    sameMonth: a.month === b.month,
  };
}
