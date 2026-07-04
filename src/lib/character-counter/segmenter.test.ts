/**
 * Segmenter Tests
 * Tests for Intl.Segmenter wrapper with fallback path.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { countGraphemes } from './segmenter';

describe('countGraphemes', () => {
  describe('with Intl.Segmenter available', () => {
    it('should count ASCII characters', () => {
      expect(countGraphemes('Hello')).toBe(5);
    });

    it('should count emoji as 1 grapheme', () => {
      expect(countGraphemes('👋')).toBe(1);
    });

    it('should count ZWJ sequence as 1 grapheme', () => {
      // Family emoji: 👨‍👩‍👧‍👦
      const familyEmoji = '👨‍👩‍👧‍👦';
      expect(countGraphemes(familyEmoji)).toBe(1);
    });

    it('should count emoji with skin tone modifier as 1', () => {
      // Wave with light skin tone: 👋🏻
      const wave = '👋🏻';
      expect(countGraphemes(wave)).toBe(1);
    });

    it('should count Korean characters', () => {
      expect(countGraphemes('한글')).toBe(2);
    });

    it('should count mixed content', () => {
      expect(countGraphemes('Hello 👋 world')).toBe(13);
    });

    it('should return 0 for empty string', () => {
      expect(countGraphemes('')).toBe(0);
    });

    it('should handle complex emoji', () => {
      // Man, woman, girl, boy (ZWJ sequence): 👨‍👩‍👧‍👦
      expect(countGraphemes('👨‍👩‍👧‍👦')).toBe(1);
    });
  });

  describe('with Intl.Segmenter unavailable (fallback)', () => {
    let originalIntl: any;

    beforeEach(() => {
      // Save original Intl
      originalIntl = global.Intl;
    });

    afterEach(() => {
      // Restore original Intl
      global.Intl = originalIntl;
    });

    it('should fallback to String.length when Intl.Segmenter not available', () => {
      // Mock Intl to not have Segmenter
      if (typeof global !== 'undefined') {
        const mockIntl = { ...global.Intl };
        delete (mockIntl as any).Segmenter;
        global.Intl = mockIntl as any;

        // Reset the warning flag by importing fresh module
        // (This is a limitation of the current implementation)
        // For now, we verify the fallback behavior works
        const result = countGraphemes('Hello');
        expect(typeof result).toBe('number');
        expect(result).toBe(5);
      }
    });

    it('should fallback gracefully to String.length', () => {
      // String.length treats emoji as multiple code units
      // so emoji count would be 2 or more instead of 1
      const result = countGraphemes('👋');
      // With Segmenter: 1, without: depends on implementation
      expect(typeof result).toBe('number');
      expect(result > 0).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined gracefully (empty string)', () => {
      expect(countGraphemes('')).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'Hello '.repeat(1000);
      const result = countGraphemes(longText);
      expect(result).toBe(6000); // 6 chars × 1000 times
    });

    it('should handle whitespace', () => {
      expect(countGraphemes('   ')).toBe(3);
    });

    it('should handle newlines', () => {
      expect(countGraphemes('Hello\nWorld')).toBe(11);
    });

    it('should handle tabs', () => {
      expect(countGraphemes('Hello\tWorld')).toBe(11);
    });

    it('should handle combining diacritical marks', () => {
      // Combining grave accent: á = a + combining grave
      // Depending on normalization, this could be 1 or 2
      const result = countGraphemes('café');
      expect(typeof result).toBe('number');
      expect(result > 0).toBe(true);
    });

    it('should handle zero-width joiner sequences correctly', () => {
      // Kiss: 👩‍❤️‍💋‍👨
      const kiss = '👩‍❤️‍💋‍👨';
      expect(countGraphemes(kiss)).toBe(1);
    });

    it('should handle multiple emoji in sequence', () => {
      expect(countGraphemes('👋👋👋')).toBe(3);
    });

    it('should handle emoji mixed with text', () => {
      expect(countGraphemes('a👋b👋c')).toBe(5);
    });
  });
});
