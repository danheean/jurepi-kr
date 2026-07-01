/**
 * Pure SVG string builder for result visualization.
 * Generates a self-contained SVG with inline hex colors (no CSS vars).
 * Used for rasterizing result images to PNG.
 */

import { levelHeightFor } from '@/components/tools/ladder/ladderLayout';

export const ACCENT_HEX: string[] = [
  '#ff7a85', // coral
  '#2dd4bf', // mint
  '#38bdf8', // sky
  '#fbbf24', // sun
  '#e0912b', // grape (honey-gold)
  '#fb7185', // rose
];

export const HAIRLINE_STRONG_HEX = '#e2d6bd';
export const TEXT_HEX = '#2a2411';
export const SURFACE_HEX = '#ffffff';
export const SURFACE_MUTED_HEX = '#faf6ee';

export interface ResultImageRow {
  name: string;
  label: string;
  accentHex: string;
}

export interface ResultImageParams {
  playerCount: number;
  rungs: boolean[][];
  rows: ResultImageRow[];
  playerNames: string[];
  prizeLabels: string[];
  title: string;
}

/**
 * Escape XML special characters in a string.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build a self-contained SVG string for ladder results.
 * Geometry:
 *  - columnWidth = 60, levelHeight = 40, padding = 30
 *  - numLevels = rungs.length || 5
 *  - vertical lines at y1=padding, y2=padding + levelHeight*(numLevels+1)
 *  - rungs at y = padding + (levelIdx+1)*levelHeight
 *  - legend below with title, then player→prize rows
 */
export function buildResultSvgString(params: ResultImageParams): string {
  const COLUMN_WIDTH = 60;
  const PADDING = 30;
  const LABEL_PADDING = 15; // space for top/bottom labels
  const LEGEND_MARGIN_TOP = 40;
  const LEGEND_LINE_HEIGHT = 24;
  const LABEL_FONT_SIZE = 12;

  const { playerCount, rungs, rows, playerNames, prizeLabels, title } = params;

  const numLevels = rungs.length || 5;
  const numColumns = playerCount;
  const LEVEL_HEIGHT = levelHeightFor(numLevels);

  // Board dimensions (including space for labels)
  const boardWidth = PADDING * 2 + COLUMN_WIDTH * numColumns;
  const boardHeight = LABEL_PADDING * 2 + PADDING * 2 + LEVEL_HEIGHT * (numLevels + 1);
  const legendHeight = LEGEND_MARGIN_TOP + LEGEND_LINE_HEIGHT * (1 + rows.length);
  const totalHeight = boardHeight + legendHeight;

  let svg = '';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${totalHeight}" viewBox="0 0 ${boardWidth} ${totalHeight}">`;

  // Background
  svg += `<rect width="${boardWidth}" height="${totalHeight}" fill="${SURFACE_HEX}"/>`;

  // Draw vertical lines (one per column)
  const verticalY1 = LABEL_PADDING + PADDING;
  const verticalY2 = LABEL_PADDING + PADDING + LEVEL_HEIGHT * (numLevels + 1);
  for (let col = 0; col < numColumns; col++) {
    const x = PADDING + col * COLUMN_WIDTH + COLUMN_WIDTH / 2;
    svg += `<line x1="${x}" y1="${verticalY1}" x2="${x}" y2="${verticalY2}" stroke="${HAIRLINE_STRONG_HEX}" stroke-width="1"/>`;
  }

  // Draw rungs (horizontal segments)
  for (let levelIdx = 0; levelIdx < rungs.length; levelIdx++) {
    const level = rungs[levelIdx];
    const y = LABEL_PADDING + PADDING + (levelIdx + 1) * LEVEL_HEIGHT;
    for (let col = 0; col < level.length; col++) {
      if (level[col]) {
        const x1 = PADDING + col * COLUMN_WIDTH + COLUMN_WIDTH / 2;
        const x2 = PADDING + (col + 1) * COLUMN_WIDTH + COLUMN_WIDTH / 2;
        svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${HAIRLINE_STRONG_HEX}" stroke-width="2"/>`;
      }
    }
  }

  // Draw player names at top (above board)
  for (let col = 0; col < numColumns; col++) {
    const name = playerNames[col] || '';
    if (name) {
      const x = PADDING + col * COLUMN_WIDTH + COLUMN_WIDTH / 2;
      const y = LABEL_PADDING - 5;
      const escapedName = escapeXml(name);
      const accentColor = ACCENT_HEX[col % ACCENT_HEX.length];
      svg += `<text x="${x}" y="${y}" font-size="${LABEL_FONT_SIZE}" text-anchor="middle" fill="${accentColor}">${escapedName}</text>`;
    }
  }

  // Draw prize labels at bottom (below board)
  for (let col = 0; col < numColumns; col++) {
    const label = prizeLabels[col] || '';
    if (label) {
      const x = PADDING + col * COLUMN_WIDTH + COLUMN_WIDTH / 2;
      const y = LABEL_PADDING + PADDING + LEVEL_HEIGHT * (numLevels + 1) + LABEL_PADDING - 3;
      const escapedLabel = escapeXml(label);
      svg += `<text x="${x}" y="${y}" font-size="${LABEL_FONT_SIZE}" text-anchor="middle" fill="${TEXT_HEX}">${escapedLabel}</text>`;
    }
  }

  // Draw legend
  const legendStartY = boardHeight + LEGEND_MARGIN_TOP;

  // Title
  const escapedTitle = escapeXml(title);
  svg += `<text x="${PADDING}" y="${legendStartY}" font-size="16" font-weight="bold" fill="${TEXT_HEX}">${escapedTitle}</text>`;

  // Player → Prize rows (without color dots, use text color instead)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const y = legendStartY + LEGEND_LINE_HEIGHT * (i + 1);
    const escapedName = escapeXml(row.name);
    const escapedLabel = escapeXml(row.label);

    // Text: "{name} → {label}" in row's accent color
    const textX = PADDING;
    svg += `<text x="${textX}" y="${y}" font-size="14" fill="${row.accentHex}">${escapedName} → ${escapedLabel}</text>`;
  }

  svg += `</svg>`;
  return svg;
}
