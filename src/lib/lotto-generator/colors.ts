export interface BallColor {
  /** Ball background color (hex). */
  background: string;
  /** Number text color (hex), chosen for contrast on the band. */
  color: string;
}

/**
 * Map a lotto number (1–45) to its official Korean lottery (동행복권) ball color.
 *
 * These are the real dhlottery ball-band colors, so a generated ball looks like
 * the numbers on the official result page. Applied as inline `background-color`
 * (not design-system tokens) because they are an external brand palette, not
 * part of the site's accent system.
 *
 *   1–10  gold   (dark numeral — gold is too light for white to stay legible)
 *  11–20  blue   (white numeral)
 *  21–30  red    (white numeral)
 *  31–40  gray   (white numeral)
 *  41–45  green  (white numeral)
 *
 * @param number - 1–45
 * @returns BallColor with background + text hex
 */
export function ballColor(number: number): BallColor {
  if (number >= 1 && number <= 10) {
    return { background: '#e9a100', color: '#1a1a1a' };
  }
  if (number >= 11 && number <= 20) {
    return { background: '#3b6fc4', color: '#ffffff' };
  }
  if (number >= 21 && number <= 30) {
    return { background: '#d23f55', color: '#ffffff' };
  }
  if (number >= 31 && number <= 40) {
    return { background: '#7c818e', color: '#ffffff' };
  }
  if (number >= 41 && number <= 45) {
    return { background: '#2aa15a', color: '#ffffff' };
  }
  // Fallback (out of range — should not happen): brand violet.
  return { background: '#6c5ce7', color: '#ffffff' };
}
