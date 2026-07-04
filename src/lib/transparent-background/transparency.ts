import type { RGB } from './schema';
import { TOLERANCE_MAX_DISTANCE, CHUNK_SIZE } from './schema';
import { euclideanDistance } from './color-distance';

/**
 * Yield control back to the browser between chunks so a full-image pass
 * doesn't block the main thread for its entire duration. Falls back to a
 * macrotask when `requestAnimationFrame` isn't available (e.g. some test
 * environments).
 */
function yieldToFrame(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Alpha multiplier for a pixel at the given color distance from the
 * background, given whether it was marked for removal (BFS-connected in
 * flood-fill mode, or distance-matched in global mode) and the feather width.
 * Pixels right at the tolerance boundary — marked or not — get a linear
 * fade instead of a hard cutoff.
 */
function computeAlphaMultiplier(
  distance: number,
  maxDistance: number,
  feather: number,
  isMarked: boolean,
): number {
  const inFeatherZone = feather > 0 && distance >= maxDistance - feather && distance <= maxDistance;

  if (isMarked) {
    return inFeatherZone ? 1 - (distance - (maxDistance - feather)) / feather : 0;
  }
  return inFeatherZone ? 1 - (distance - (maxDistance - feather)) / feather : 1;
}

/**
 * Apply transparency to an image by removing pixels matching the background color.
 * Creates a new ImageData; the input is not mutated.
 *
 * Processes in `CHUNK_SIZE`-pixel chunks, yielding to the browser between
 * chunks (via requestAnimationFrame) so large images don't freeze the tab
 * while the user is dragging the tolerance/feather sliders.
 *
 * @param imageData - Source image data
 * @param bgColor - Background color to remove
 * @param tolerance - 0–100 slider value; maps to RGB distance 0–85
 * @param feather - 0–20 pixels for edge softening
 * @param mode - 'flood-fill' (only connected region) or 'global' (all matching colors)
 * @returns New ImageData with alpha modified
 */
export async function applyTransparency(
  imageData: ImageData,
  bgColor: RGB,
  tolerance: number,
  feather: number,
  mode: 'flood-fill' | 'global',
): Promise<ImageData> {
  // Map tolerance (0–100) to max distance (0–85)
  const maxDistance = TOLERANCE_MAX_DISTANCE * (tolerance / 100);

  // Create a copy of the image data
  const result = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  if (mode === 'flood-fill') {
    // Mark connected regions from corners for removal, then apply feathered alpha.
    const visited = await markFloodFillRegion(result, bgColor, maxDistance);
    await applyMaskedAlpha(result, visited, bgColor, maxDistance, feather);
  } else {
    // Global mode marks and applies alpha in a single pass — a pixel's mark
    // state is exactly `distance <= maxDistance`, so there's no need for a
    // separate marking pass (unlike flood-fill's BFS, which does need one).
    await applyGlobalAlpha(result, bgColor, maxDistance, feather);
  }

  return result;
}

/**
 * Mark connected regions starting from the four corners for removal.
 * Uses BFS to find all connected pixels matching the background color (within tolerance).
 */
async function markFloodFillRegion(
  imageData: ImageData,
  bgColor: RGB,
  maxDistance: number,
): Promise<Uint8Array> {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);

  // Seeds: four corners (top-left, top-right, bottom-left, bottom-right)
  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  const queue: [number, number][] = [];

  for (const [sx, sy] of seeds) {
    const idx = sy * width + sx;
    if (visited[idx]) continue;

    const pixelColor = getPixelColor(data, width, sx, sy);
    if (euclideanDistance(pixelColor, bgColor) <= maxDistance) {
      queue.push([sx, sy]);
      visited[idx] = 1;
    }
  }

  let processedSinceYield = 0;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    // Process neighbors (4-connected)
    const neighbors: [number, number][] = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

      const nIdx = ny * width + nx;
      if (visited[nIdx]) continue;

      const nColor = getPixelColor(data, width, nx, ny);
      const distance = euclideanDistance(nColor, bgColor);

      if (distance <= maxDistance) {
        visited[nIdx] = 1;
        queue.push([nx, ny]);
      }
    }

    processedSinceYield++;
    if (processedSinceYield >= CHUNK_SIZE) {
      processedSinceYield = 0;
      await yieldToFrame();
    }
  }

  return visited;
}

/**
 * Global mode: mark and apply alpha for every pixel in a single chunked pass.
 */
async function applyGlobalAlpha(
  imageData: ImageData,
  bgColor: RGB,
  maxDistance: number,
  feather: number,
): Promise<void> {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const distance = euclideanDistance({ r: data[idx], g: data[idx + 1], b: data[idx + 2] }, bgColor);
    const isMarked = distance <= maxDistance;
    const alphaMultiplier = computeAlphaMultiplier(distance, maxDistance, feather, isMarked);

    data[idx + 3] = Math.round(data[idx + 3] * alphaMultiplier);

    if ((i + 1) % CHUNK_SIZE === 0) {
      await yieldToFrame();
    }
  }
}

/**
 * Flood-fill mode: apply feathered alpha using the BFS-marked pixel mask.
 */
async function applyMaskedAlpha(
  imageData: ImageData,
  visited: Uint8Array,
  bgColor: RGB,
  maxDistance: number,
  feather: number,
): Promise<void> {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const distance = euclideanDistance({ r: data[idx], g: data[idx + 1], b: data[idx + 2] }, bgColor);
    const alphaMultiplier = computeAlphaMultiplier(distance, maxDistance, feather, visited[i] === 1);

    data[idx + 3] = Math.round(data[idx + 3] * alphaMultiplier);

    if ((i + 1) % CHUNK_SIZE === 0) {
      await yieldToFrame();
    }
  }
}

/**
 * Get RGB color of a pixel at (x, y).
 */
function getPixelColor(data: Uint8ClampedArray, width: number, x: number, y: number): RGB {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
  };
}
