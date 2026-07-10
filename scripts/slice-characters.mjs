#!/usr/bin/env node
/**
 * Generate per-tool square character avatars into public/characters/<slug>.webp.
 *
 * Two sources, in priority order per slug:
 *   1. A clean per-tool individual image at
 *      docs/resources/jurepi_characters/<slug>.png (1254×1254, self-framed
 *      app-icon, no bleed) — preferred. Resized straight into the square frame.
 *   2. Fallback: a tile sliced from the sprite sheet
 *      docs/resources/jurepi_characters/jurepi_characters.png (6×4 grid of 24),
 *      contain-padded into the same square frame so the layout stays uniform
 *      until an individual image is generated.
 *
 * Output is a uniform 1:1 square so <Image> uses one fixed width/height
 * (CLS-safe) and every tool avatar shares the same framed shape. Requires
 * ImageMagick (`magick`) on PATH. Re-run whenever an individual image is added
 * or the sprite is regenerated. TILE_TO_SLUG is the single source of truth for
 * the sprite grid→tool mapping (left→right, top→bottom, 0-indexed).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CHAR_DIR = join(ROOT, 'docs/resources/jurepi_characters');
const SPRITE = join(CHAR_DIR, 'jurepi_characters.png');
const OUT_DIR = join(ROOT, 'public/characters');

const COLS = 6;
const ROWS = 4;
// Uniform 1:1 square output. Individual images are already square and
// self-framed; sprite fallbacks are CONTAIN-fit + centre-extent so the portrait
// tile is padded (never clipped) into the same square cream frame. 300×300 is
// retina-safe for the ~72px avatar display.
const OUT_SIZE = 300;
const QUALITY = 80;
const PAD = '#fdf3e2'; // sheet cream (sampled from the sprite corners)

// The sheet has an outer margin and uneven gutters, so equal division bleeds
// neighbors in. These cut lines were measured from the brightness profile
// (gutters = local cream maxima; outer edges = small inset that keeps a thin
// cream border without clipping any character). 7 x-cuts → 6 columns; 5 y-cuts
// → 4 rows. See scripts note; re-measure if the sprite is regenerated.
// Note: the col-1 cut is pulled left of the raw gutter (261) so find-replace's
// "문장 A→B" label — which sits right on the boundary — isn't clipped; the
// character-counter content to its left ends well before this.
const X_CUTS = [16, 246, 434, 623, 818, 1029, 1240];
const Y_CUTS = [56, 349, 634, 910, 1200];

// Grid index (row-major, 0-based) → asset slug. `null` = unused spare tile.
const TILE_TO_SLUG = [
  null,             // 0  dev montage (spare)
  'ladder',         // 1
  'roulette',       // 2
  'age-calculator', // 3
  'knitting-gauge', // 4
  'new-word',       // 5
  'character-counter', // 6
  'find-replace',   // 7
  'lunar-converter',// 8
  'qr-code',        // 9
  'transparent-background', // 10
  'unit-converter', // 11
  'speed-quiz',     // 12
  'restaurant-map', // 13
  'qna-a-day',      // 14
  'bookmarks',      // 15
  'dev-people',     // 16
  'url-encoder',    // 17
  'json-formatter', // 18
  'base64-encoder', // 19
  'my-ip',          // 20
  'howto',          // 21
  'rankings',       // 22
  'home',           // 23  arms-spread welcome pose
  'cron-parser',    // 24  individual image only (beyond the 6×4 sprite grid; tile math unused)
];

function main() {
  if (!existsSync(SPRITE)) {
    console.error(`[chars] sprite not found: ${SPRITE}`);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  TILE_TO_SLUG.forEach((slug, i) => {
    if (!slug) return;
    const dest = join(OUT_DIR, `${slug}.webp`);
    const individual = join(CHAR_DIR, `${slug}.png`);

    // Prefer the clean per-tool individual image (no bleed, self-framed).
    if (existsSync(individual)) {
      const edge = OUT_SIZE - 1;
      execFileSync('magick', [
        individual,
        '-resize', `${OUT_SIZE}x${OUT_SIZE}`,
        '-background', PAD,
        '-gravity', 'center',
        '-extent', `${OUT_SIZE}x${OUT_SIZE}`,
        // Normalize edge-connected white backgrounds to the sheet cream so every
        // avatar shares one frame tone. Flood-fill from the four corners only —
        // interior whites (QR modules, speech bubbles, checkerboards) are
        // enclosed by outlines and stay untouched. No-op on already-cream tiles.
        '-fuzz', '8%',
        '-fill', PAD,
        '-draw', 'color 0,0 floodfill',
        '-draw', `color ${edge},0 floodfill`,
        '-draw', `color 0,${edge} floodfill`,
        '-draw', `color ${edge},${edge} floodfill`,
        '-quality', String(QUALITY),
        dest,
      ]);
      const kb = (statSync(dest).size / 1024).toFixed(1);
      console.log(`[chars] ${slug} ← individual image → ${slug}.webp (${kb} KB)`);
      written += 1;
      return;
    }

    // Fallback: slice the sprite tile and pad it into the same square frame.
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x = X_CUTS[col];
    const y = Y_CUTS[row];
    const w = X_CUTS[col + 1] - x;
    const h = Y_CUTS[row + 1] - y;
    execFileSync('magick', [
      SPRITE,
      '-crop', `${w}x${h}+${x}+${y}`,
      '+repage',
      '-resize', `${OUT_SIZE}x${OUT_SIZE}`,
      '-background', PAD,
      '-gravity', 'center',
      '-extent', `${OUT_SIZE}x${OUT_SIZE}`,
      '-quality', String(QUALITY),
      dest,
    ]);
    const kb = (statSync(dest).size / 1024).toFixed(1);
    console.log(`[chars] ${slug} ← sprite tile ${String(i).padStart(2)} (r${row}c${col}) → ${slug}.webp (${kb} KB)`);
    written += 1;
  });

  console.log(`[chars] wrote ${written} assets to public/characters/`);
}

main();
