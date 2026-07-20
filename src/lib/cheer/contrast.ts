import type { ColorSwatchId } from './schema';
import { MIN_CONTRAST } from './schema';

export { MIN_CONTRAST } from './schema';

/**
 * Map swatch IDs to their hex color values from DESIGN.md tokens.
 */
const SWATCH_COLORS: Record<ColorSwatchId, string> = {
  white: '#ffffff',
  black: '#000000',
  coral: '#ff7a85', // --accent-coral
  sun: '#fbbf24', // --accent-sun
  sky: '#38bdf8', // --accent-sky
  grape: '#e0912b', // --accent-grape
  rose: '#fb7185', // --accent-rose
};

/**
 * Parse hex color to RGB triplet.
 * @param hex - hex string like "#2a2411" or "2a2411"
 * @returns [r, g, b] 0–255
 */
function parseHex(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/i.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculate relative luminance per WCAG 2.1.
 * @param hex - hex color string
 * @returns relative luminance (0–1)
 */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);

  // Convert to 0–1 range
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;

  // Apply gamma (linearize sRGB)
  const rLinear = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const gLinear = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const bLinear = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  // Weighted luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio per WCAG 2.1.
 * @param textColor - swatch ID for text color
 * @param bgColor - swatch ID for background color
 * @returns contrast ratio (1–21)
 */
export function contrastRatio(textColor: ColorSwatchId, bgColor: ColorSwatchId): number {
  const textLum = relativeLuminance(SWATCH_COLORS[textColor]);
  const bgLum = relativeLuminance(SWATCH_COLORS[bgColor]);

  const lighter = Math.max(textLum, bgLum);
  const darker = Math.min(textLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color pair has low contrast (< MIN_CONTRAST = 3.0).
 * @param textColor - swatch ID for text color
 * @param bgColor - swatch ID for background color
 * @returns true if contrast ratio < MIN_CONTRAST (warning condition)
 */
export function isLowContrast(textColor: ColorSwatchId, bgColor: ColorSwatchId): boolean {
  return contrastRatio(textColor, bgColor) < MIN_CONTRAST;
}
