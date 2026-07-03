export interface SvgExportOptions {
  size: number;
  quietZone: number;
  fgColor: string;
  bgColor: string;
}

/**
 * Generate SVG XML from QR module matrix.
 * Hand-rolled, no external SVG libraries.
 * @param matrix - boolean[][] from encoder
 * @param options - size, quietZone, colors
 * @returns valid SVG XML string
 */
export function matrixToSvg(
  matrix: boolean[][],
  options: SvgExportOptions
): string {
  const { size, quietZone, fgColor, bgColor } = options;

  const moduleCount = matrix.length + quietZone * 2;
  const moduleSize = size / moduleCount;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;

  // Background
  svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;

  // Modules (black = foreground)
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const x = (col + quietZone) * moduleSize;
        const y = (row + quietZone) * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${fgColor}"/>`;
      }
    }
  }

  svg += '</svg>';
  return svg;
}
