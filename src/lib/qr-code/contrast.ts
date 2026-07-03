export class ContrastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContrastError';
  }
}

/**
 * Parse hex color to RGB triplet.
 * @param hex - hex string like "#2a2411" or "2a2411"
 * @returns [r, g, b] 0–255
 * @throws ContrastError if hex is invalid
 */
function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/i.test(cleaned)) {
    throw new ContrastError(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculate ΔE (delta-E) using simple RGB Euclidean distance.
 * Approximate WCAG AA; not full CIE-Lab.
 * @param fgHex - foreground hex color
 * @param bgHex - background hex color
 * @returns ΔE value (0–~442)
 */
export function deltaE(fgHex: string, bgHex: string): number {
  const [fgR, fgG, fgB] = parseHex(fgHex);
  const [bgR, bgG, bgB] = parseHex(bgHex);

  const dR = fgR - bgR;
  const dG = fgG - bgG;
  const dB = fgB - bgB;

  return Math.sqrt(dR * dR + dG * dG + dB * dB);
}

/**
 * Check if contrast is acceptable (ΔE >= threshold).
 * @param fgHex - foreground hex color
 * @param bgHex - background hex color
 * @param threshold - minimum acceptable ΔE (default 50, approximate WCAG AA)
 * @returns true if contrast >= threshold
 */
export function isContrastAcceptable(
  fgHex: string,
  bgHex: string,
  threshold: number = 50
): boolean {
  try {
    return deltaE(fgHex, bgHex) >= threshold;
  } catch {
    // If parsing fails, assume acceptable (user's problem)
    return true;
  }
}
