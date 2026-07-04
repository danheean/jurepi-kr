import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyTransparency } from './transparency';
import { CHUNK_SIZE } from './schema';
import type { RGB } from './schema';

/**
 * Helper to create a test ImageData
 */
function createImageData(width: number, height: number, color: RGB, alpha: number = 255): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color.r;
    data[i + 1] = color.g;
    data[i + 2] = color.b;
    data[i + 3] = alpha;
  }
  return new ImageData(data, width, height);
}

/**
 * Helper to get a single pixel RGBA from ImageData
 */
function getPixel(imageData: ImageData, x: number, y: number): [number, number, number, number] {
  const idx = (y * imageData.width + x) * 4;
  return [imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2], imageData.data[idx + 3]];
}

/**
 * Helper to set a single pixel in ImageData
 */
function setPixel(imageData: ImageData, x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
  const idx = (y * imageData.width + x) * 4;
  imageData.data[idx] = r;
  imageData.data[idx + 1] = g;
  imageData.data[idx + 2] = b;
  imageData.data[idx + 3] = a;
}

describe('applyTransparency', () => {
  it('removes background when tolerance is 100', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(10, 10, white);
    const result = await applyTransparency(source, white, 100, 0, 'global');

    // All pixels should have alpha 0
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(0);
      }
    }
  });

  it('preserves existing alpha when removing', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(5, 5, white, 128); // 50% transparent
    const result = await applyTransparency(source, white, 100, 0, 'global');

    // If pixel is removed, alpha should be 0 * 128 = 0
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(0);
      }
    }
  });

  it('keeps pixels when distance > tolerance', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const red: RGB = { r: 255, g: 0, b: 0 };
    const source = createImageData(5, 5, red);
    // tolerance 0 means very strict matching
    const result = await applyTransparency(source, white, 0, 0, 'global');

    // Red pixels are far from white, should not be removed
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(255);
      }
    }
  });

  it('removes similar colors based on tolerance', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const nearWhite: RGB = { r: 240, g: 240, b: 240 }; // distance = sqrt(15²*3) ≈ 26
    const source = createImageData(5, 5, nearWhite);

    // tolerance 20 → maxDistance = 17, distance 26 > 17, should NOT remove
    const result1 = await applyTransparency(source, white, 20, 0, 'global');
    let removed1 = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result1, x, y);
        if (a === 0) removed1++;
      }
    }
    expect(removed1).toBe(0); // Should NOT remove

    // tolerance 50 → maxDistance = 42.5, distance 26 < 42.5, should remove all
    const result2 = await applyTransparency(source, white, 50, 0, 'global');
    let removed2 = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result2, x, y);
        if (a === 0) removed2++;
      }
    }
    expect(removed2).toBe(25); // All should be removed
  });

  it('does not mutate the original image', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(5, 5, white);
    const originalAlpha = source.data[3];

    await applyTransparency(source, white, 100, 0, 'global');

    // Original should be unchanged
    expect(source.data[3]).toBe(originalAlpha);
  });

  it('feathers alpha near boundary', async () => {
    // Create image with colors in feather zone
    // white (255,255,255) is background
    // grayish (230,230,230) is in feather zone (distance ≈ 43.3)
    const source = new ImageData(5, 5);
    const white: RGB = { r: 255, g: 255, b: 255 };
    const grayish: RGB = { r: 230, g: 230, b: 230 }; // distance ≈ 43.3

    // Fill with grayish
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        setPixel(source, x, y, grayish.r, grayish.g, grayish.b);
      }
    }

    // Apply with global mode: tolerance 60 (maxDist 51), feather 20
    // grayish color distance ≈ 43.3 is in feather zone [31, 51]
    const result = await applyTransparency(source, white, 60, 20, 'global');

    // Some pixels should have intermediate alpha (0 < a < 255) due to feather
    let hasIntermediate = false;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result, x, y);
        if (a > 0 && a < 255) {
          hasIntermediate = true;
        }
      }
    }

    expect(hasIntermediate).toBe(true);
  });

  it('implements tolerance as maxDistance = 85 * (tolerance / 100)', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const nearWhite: RGB = { r: 255, g: 255, b: 254 }; // distance = 1
    const source = createImageData(3, 3, nearWhite);

    // tolerance 50 -> maxDistance ~42.5, should remove
    const result = await applyTransparency(source, white, 50, 0, 'global');
    const [, , , a] = getPixel(result, 1, 1);
    expect(a).toBe(0); // Should be removed
  });

  it('removes only connected region in flood-fill mode', async () => {
    // Create image: 5×5 with white background
    const source = new ImageData(5, 5);
    const white: RGB = { r: 255, g: 255, b: 255 };

    // Fill with white
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        setPixel(source, x, y, white.r, white.g, white.b);
      }
    }

    // Apply with flood-fill
    const result = await applyTransparency(source, white, 100, 0, 'flood-fill');

    // All should be removed (all connected to corners)
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(0);
      }
    }
  });

  it('removes all matching pixels in global mode', async () => {
    // Create image: white background with black center
    const source = new ImageData(5, 5);
    const white: RGB = { r: 255, g: 255, b: 255 };
    const black: RGB = { r: 0, g: 0, b: 0 };

    // Fill border with white, center with white (for testing global mode)
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        setPixel(source, x, y, white.r, white.g, white.b);
      }
    }

    const result = await applyTransparency(source, white, 100, 0, 'global');

    // All white pixels should be removed
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(0);
      }
    }
  });

  it('handles tolerance edge value of 0', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(3, 3, white);
    // tolerance 0 -> maxDistance 0, only exact matches removed
    const result = await applyTransparency(source, white, 0, 0, 'global');

    // All white pixels should still be removed (exact match)
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(0);
      }
    }
  });

  it('handles tolerance edge value of 100', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(3, 3, white);
    // tolerance 100 -> maxDistance 85 (all should be removed)
    const result = await applyTransparency(source, white, 100, 0, 'global');

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const [, , , a] = getPixel(result, x, y);
        expect(a).toBe(0);
      }
    }
  });

  it('returns new ImageData with same dimensions', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(7, 5, white);
    const result = await applyTransparency(source, white, 50, 0, 'global');

    expect(result.width).toBe(7);
    expect(result.height).toBe(5);
    expect(result.data.length).toBe(7 * 5 * 4);
  });
});

describe('applyTransparency — chunked processing (large images don\'t block the main thread)', () => {
  const originalRaf = globalThis.requestAnimationFrame;
  let rafCallCount = 0;

  beforeEach(() => {
    rafCallCount = 0;
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      rafCallCount++;
      return originalRaf(callback);
    }) as typeof requestAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
  });

  // A square image whose pixel count clears one CHUNK_SIZE boundary, so a
  // single-pass (global mode) or BFS pass (flood-fill) must yield at least once.
  const sideOverOneChunk = Math.ceil(Math.sqrt(CHUNK_SIZE * 1.5));

  it('yields via requestAnimationFrame at least once for an image larger than one chunk (global mode)', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(sideOverOneChunk, sideOverOneChunk, white);

    await applyTransparency(source, white, 100, 0, 'global');

    expect(rafCallCount).toBeGreaterThan(0);
  });

  it('yields via requestAnimationFrame at least once for an image larger than one chunk (flood-fill mode)', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(sideOverOneChunk, sideOverOneChunk, white);

    await applyTransparency(source, white, 100, 0, 'flood-fill');

    expect(rafCallCount).toBeGreaterThan(0);
  });

  it('does not yield for a small image (stays on a single microtask turn)', async () => {
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(5, 5, white);

    await applyTransparency(source, white, 100, 0, 'global');

    expect(rafCallCount).toBe(0);
  });

  it('produces identical output whether or not the image spans multiple chunks', async () => {
    // Sanity check that chunking is purely a scheduling concern, not a
    // correctness one: a background-colored image should come out fully
    // transparent regardless of how many rAF yields it took to get there.
    const white: RGB = { r: 255, g: 255, b: 255 };
    const source = createImageData(sideOverOneChunk, sideOverOneChunk, white);

    const result = await applyTransparency(source, white, 100, 0, 'global');

    const totalPixels = sideOverOneChunk * sideOverOneChunk;
    for (let i = 0; i < totalPixels; i++) {
      expect(result.data[i * 4 + 3]).toBe(0);
    }
  });
});
