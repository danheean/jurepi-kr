import { describe, it, expect } from 'vitest';
import {
  sliceAngle,
  buildSliceGeometry,
  finalSpinAngle,
  type SliceInfo,
} from './geometry';
import type { Option } from './schema';

describe('geometry.ts', () => {
  describe('sliceAngle', () => {
    it('calculates angle proportional to weight', () => {
      const angle = sliceAngle(1, 4); // 1/4 of 360
      expect(angle).toBe(90);
    });

    it('returns 360 for all weight', () => {
      const angle = sliceAngle(10, 10); // 10/10 of 360
      expect(angle).toBe(360);
    });

    it('returns 180 for half weight', () => {
      const angle = sliceAngle(1, 2); // 1/2 of 360
      expect(angle).toBe(180);
    });

    it('handles fractional weights', () => {
      const angle = sliceAngle(1, 3); // 1/3 of 360
      expect(angle).toBeCloseTo(120, 5);
    });

    it('handles zero weight edge case', () => {
      const angle = sliceAngle(0, 10);
      expect(angle).toBe(0);
    });

    it('handles zero total weight edge case', () => {
      const angle = sliceAngle(1, 0);
      expect(Number.isFinite(angle)).toBe(false); // Infinity or NaN
    });
  });

  describe('buildSliceGeometry', () => {
    it('returns correct number of slices', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
        { label: 'C', weight: 1 },
      ];
      const slices = buildSliceGeometry(options);
      expect(slices.length).toBe(3);
    });

    it('produces slices that sum to 360 degrees', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
        { label: 'C', weight: 3 },
      ];
      const slices = buildSliceGeometry(options);
      const totalSpan = slices.reduce((sum, s) => sum + s.span, 0);
      expect(totalSpan).toBeCloseTo(360, 5);
    });

    it('calculates correct angles for equal weights', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
        { label: 'C', weight: 1 },
        { label: 'D', weight: 1 },
      ];
      const slices = buildSliceGeometry(options);
      expect(slices[0].angle).toBe(0);
      expect(slices[0].span).toBeCloseTo(90, 5);
      expect(slices[1].angle).toBeCloseTo(90, 5);
      expect(slices[1].span).toBeCloseTo(90, 5);
      expect(slices[2].angle).toBeCloseTo(180, 5);
      expect(slices[3].angle).toBeCloseTo(270, 5);
    });

    it('calculates correct midAngles for radial text', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
      ];
      const slices = buildSliceGeometry(options);
      // First slice: 0 to 180, midAngle = 90
      expect(slices[0].midAngle).toBeCloseTo(90, 5);
      // Second slice: 180 to 360, midAngle = 270
      expect(slices[1].midAngle).toBeCloseTo(270, 5);
    });

    it('respects weighted proportions', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
        { label: 'C', weight: 3 },
      ];
      const slices = buildSliceGeometry(options);
      // Total weight = 6
      // A: 1/6 * 360 = 60
      // B: 2/6 * 360 = 120
      // C: 3/6 * 360 = 180
      expect(slices[0].span).toBeCloseTo(60, 5);
      expect(slices[1].span).toBeCloseTo(120, 5);
      expect(slices[2].span).toBeCloseTo(180, 5);
    });

    it('starts each slice at the end of the previous one', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
        { label: 'C', weight: 1 },
      ];
      const slices = buildSliceGeometry(options);
      // Slice 1 starts where 0 ends
      expect(slices[1].angle).toBeCloseTo(
        slices[0].angle + slices[0].span,
        5
      );
      // Slice 2 starts where 1 ends
      expect(slices[2].angle).toBeCloseTo(
        slices[1].angle + slices[1].span,
        5
      );
    });

    it('handles single option', () => {
      const options: Option[] = [{ label: 'A', weight: 1 }];
      const slices = buildSliceGeometry(options);
      expect(slices.length).toBe(1);
      expect(slices[0].angle).toBe(0);
      expect(slices[0].span).toBeCloseTo(360, 5);
      expect(slices[0].midAngle).toBeCloseTo(180, 5);
    });

    it('handles 30 options', () => {
      const options: Option[] = Array.from({ length: 30 }, (_, i) => ({
        label: `Option ${i}`,
        weight: 1,
      }));
      const slices = buildSliceGeometry(options);
      expect(slices.length).toBe(30);
      const totalSpan = slices.reduce((sum, s) => sum + s.span, 0);
      expect(totalSpan).toBeCloseTo(360, 5);
    });

    it('has all slices with valid angles in [0, 360)', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
        { label: 'C', weight: 3 },
      ];
      const slices = buildSliceGeometry(options);
      for (const slice of slices) {
        expect(slice.angle).toBeGreaterThanOrEqual(0);
        expect(slice.angle).toBeLessThan(360);
        expect(slice.midAngle).toBeGreaterThanOrEqual(0);
        expect(slice.midAngle).toBeLessThan(360);
      }
    });
  });

  describe('finalSpinAngle', () => {
    it('rotates winner to top (0 degrees)', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
        { label: 'C', weight: 1 },
      ];
      const slices = buildSliceGeometry(options);

      // Winner is option 0, whose midAngle should point to 0° (top)
      const angle0 = finalSpinAngle(0, slices);
      // With 3 equal slices: each is 120° wide
      // Slice 0: angle=0, span=120, midAngle=60
      // To rotate midAngle 60 to 0, we rotate by 300° (360 - 60)
      expect(angle0).toBeCloseTo(300, 1);
    });

    it('rotates different winners to top', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 1 },
        { label: 'C', weight: 1 },
        { label: 'D', weight: 1 },
      ];
      const slices = buildSliceGeometry(options);

      // For each winner, check that finalSpinAngle positions it at the top
      for (let i = 0; i < 4; i++) {
        const angle = finalSpinAngle(i, slices);
        // After rotation by angle, the midAngle of slice[i] should be at 0°
        const rotatedAngle = (slices[i].midAngle + angle) % 360;
        expect(rotatedAngle).toBeCloseTo(0, 1);
      }
    });

    it('produces angles in [0, 360)', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
        { label: 'C', weight: 3 },
      ];
      const slices = buildSliceGeometry(options);

      for (let i = 0; i < 3; i++) {
        const angle = finalSpinAngle(i, slices);
        expect(angle).toBeGreaterThanOrEqual(0);
        expect(angle).toBeLessThan(360);
      }
    });

    it('handles single slice', () => {
      const options: Option[] = [{ label: 'A', weight: 1 }];
      const slices = buildSliceGeometry(options);
      const angle = finalSpinAngle(0, slices);
      // Single slice has midAngle = 180, so finalAngle = 180 (to rotate 180 to 0)
      expect(angle).toBeCloseTo(180, 1);
    });

    it('returns different angles for different winners (unequal weights)', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
        { label: 'C', weight: 3 },
      ];
      const slices = buildSliceGeometry(options);

      const angle0 = finalSpinAngle(0, slices);
      const angle1 = finalSpinAngle(1, slices);
      const angle2 = finalSpinAngle(2, slices);

      // All should be different (different midAngles)
      expect(angle0).not.toBeCloseTo(angle1, 1);
      expect(angle1).not.toBeCloseTo(angle2, 1);
      expect(angle0).not.toBeCloseTo(angle2, 1);
    });
  });

  describe('geometry immutability', () => {
    it('sliceGeometry does not mutate options', () => {
      const options: Option[] = [
        { label: 'A', weight: 1 },
        { label: 'B', weight: 2 },
      ];
      const optionsCopy = JSON.parse(JSON.stringify(options));

      buildSliceGeometry(options);

      expect(options).toEqual(optionsCopy);
    });
  });
});
