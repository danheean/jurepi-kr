export interface BallColor {
  bgClass: string;
  textClass: string;
}

/**
 * Map lotto number 1–45 to official Korean ball band color.
 *
 * Bands follow the official Korean lotto grouping, but text uses the dark
 * `--text` token on every band: the accent tokens are all bright/light
 * (accent-sun #fbbf24, accent-sky #38bdf8, accent-coral #ff7a85,
 * accent-mint #2dd4bf), so white text fails WCAG AA — dark text clears 4.5:1
 * on all of them.
 *
 * 1–10: yellow (bg-accent-sun, text-text)
 * 11–20: blue (bg-accent-sky, text-text)
 * 21–30: red (bg-accent-coral, text-text)
 * 31–40: gray (bg-surface-sunken, text-text)
 * 41–45: green (bg-accent-mint, text-text)
 *
 * @param number - 1–45
 * @returns BallColor with Tailwind classes
 */
export function ballColor(number: number): BallColor {
  if (number >= 1 && number <= 10) {
    return { bgClass: 'bg-accent-sun', textClass: 'text-text' };
  }
  if (number >= 11 && number <= 20) {
    return { bgClass: 'bg-accent-sky', textClass: 'text-text' };
  }
  if (number >= 21 && number <= 30) {
    return { bgClass: 'bg-accent-coral', textClass: 'text-text' };
  }
  if (number >= 31 && number <= 40) {
    return { bgClass: 'bg-surface-sunken', textClass: 'text-text' };
  }
  if (number >= 41 && number <= 45) {
    return { bgClass: 'bg-accent-mint', textClass: 'text-text' };
  }
  // Fallback (should not happen)
  return { bgClass: 'bg-brand', textClass: 'text-on-brand' };
}
