import { describe, it, expect } from 'vitest';
import { suggestAutoSize, resolveEffectiveSize } from './size';
import { DEFAULT_SETTINGS } from './schema';

describe('size.ts', () => {
  describe('suggestAutoSize — mobile thresholds', () => {
    it('returns XL for very short text (1 char)', () => {
      expect(suggestAutoSize(1, 'mobile')).toBe('XL');
    });

    it('returns XL at the upper boundary (10 chars)', () => {
      expect(suggestAutoSize(10, 'mobile')).toBe('XL');
    });

    it('returns L just past the XL boundary (11 chars)', () => {
      expect(suggestAutoSize(11, 'mobile')).toBe('L');
    });

    it('returns L at its upper boundary (28 chars)', () => {
      expect(suggestAutoSize(28, 'mobile')).toBe('L');
    });

    it('returns M just past the L boundary (29 chars)', () => {
      expect(suggestAutoSize(29, 'mobile')).toBe('M');
    });

    it('returns M at its upper boundary (55 chars)', () => {
      expect(suggestAutoSize(55, 'mobile')).toBe('M');
    });

    it('returns S just past the M boundary (56 chars)', () => {
      expect(suggestAutoSize(56, 'mobile')).toBe('S');
    });

    it('returns S at MAX_LEN (80 chars)', () => {
      expect(suggestAutoSize(80, 'mobile')).toBe('S');
    });
  });

  describe('suggestAutoSize — tablet thresholds', () => {
    it('returns XL for very short text (1 char)', () => {
      expect(suggestAutoSize(1, 'tablet')).toBe('XL');
    });

    it('returns XL at the upper boundary (6 chars)', () => {
      expect(suggestAutoSize(6, 'tablet')).toBe('XL');
    });

    it('returns L just past the XL boundary (7 chars)', () => {
      expect(suggestAutoSize(7, 'tablet')).toBe('L');
    });

    it('returns L at its upper boundary (18 chars)', () => {
      expect(suggestAutoSize(18, 'tablet')).toBe('L');
    });

    it('returns M just past the L boundary (19 chars)', () => {
      expect(suggestAutoSize(19, 'tablet')).toBe('M');
    });

    it('returns M at its upper boundary (50 chars)', () => {
      expect(suggestAutoSize(50, 'tablet')).toBe('M');
    });

    it('returns S just past the M boundary (51 chars)', () => {
      expect(suggestAutoSize(51, 'tablet')).toBe('S');
    });

    it('returns S at MAX_LEN (80 chars)', () => {
      expect(suggestAutoSize(80, 'tablet')).toBe('S');
    });
  });

  describe('suggestAutoSize — device comparison', () => {
    // Counter-intuitive but measured: tablet's thresholds are tighter than
    // mobile's, because CheerDisplay's font is sized with vw (viewport width)
    // while the display box height is the device's fixed dvh. A portrait
    // tablet is wider relative to its height than a phone is, so the same
    // character count wraps into more of the tablet's vertical room. See the
    // AUTO_SIZE_THRESHOLDS comment in size.ts for the full explanation.
    it('holds a larger bucket on mobile than tablet for the same mid-range length', () => {
      // 20 chars: tablet has already dropped to M, mobile still shows L.
      expect(suggestAutoSize(20, 'mobile')).toBe('L');
      expect(suggestAutoSize(20, 'tablet')).toBe('M');
    });
  });

  describe('suggestAutoSize — edge cases', () => {
    it('treats 0 length as the largest bucket (defensive, text is normally min 1)', () => {
      expect(suggestAutoSize(0, 'mobile')).toBe('XL');
    });

    it('never returns a bucket outside S/M/L/XL for lengths beyond MAX_LEN', () => {
      expect(['S', 'M', 'L', 'XL']).toContain(suggestAutoSize(1000, 'mobile'));
      expect(['S', 'M', 'L', 'XL']).toContain(suggestAutoSize(1000, 'tablet'));
    });
  });

  describe('resolveEffectiveSize', () => {
    it('returns the manual size unchanged when sizeMode is "manual"', () => {
      const settings = { ...DEFAULT_SETTINGS, size: 'S' as const, sizeMode: 'manual' as const, text: 'a'.repeat(70) };
      expect(resolveEffectiveSize(settings)).toBe('S');
    });

    it('ignores the stored size and computes from text length + deviceType when sizeMode is "auto"', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        size: 'S' as const, // stale manual value — should be ignored in auto mode
        sizeMode: 'auto' as const,
        deviceType: 'mobile' as const,
        text: 'go go go!!', // 10 chars → XL on mobile
      };
      expect(resolveEffectiveSize(settings)).toBe('XL');
    });

    it('recomputes as text length crosses a threshold in auto mode', () => {
      const base = { ...DEFAULT_SETTINGS, sizeMode: 'auto' as const, deviceType: 'tablet' as const };
      expect(resolveEffectiveSize({ ...base, text: 'a'.repeat(6) })).toBe('XL');
      expect(resolveEffectiveSize({ ...base, text: 'a'.repeat(7) })).toBe('L');
    });

    it('uses tablet thresholds when deviceType is "tablet" in auto mode', () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        sizeMode: 'auto' as const,
        deviceType: 'tablet' as const,
        text: 'a'.repeat(20),
      };
      expect(resolveEffectiveSize(settings)).toBe('M');
    });
  });
});
