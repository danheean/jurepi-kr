import { describe, it, expect } from 'vitest';
import { normalizeMessage, isValidMessage, MIN_LEN, MAX_LEN } from './sanitize';

describe('sanitize.ts', () => {
  describe('normalizeMessage', () => {
    it('trims leading/trailing whitespace', () => {
      expect(normalizeMessage('  hello  ')).toBe('hello');
      expect(normalizeMessage('\n응원!\n')).toBe('응원!');
    });

    it('collapses internal whitespace', () => {
      expect(normalizeMessage('hello   world')).toBe('hello world');
      expect(normalizeMessage('a\t\tb')).toBe('a b');
      expect(normalizeMessage('a\n\nb')).toBe('a b');
    });

    it('does NOT cap length (isValidMessage does that)', () => {
      const long = 'a'.repeat(100);
      const result = normalizeMessage(long);
      expect(result.length).toBe(100);
    });

    it('preserves text within limit', () => {
      const text = 'Hello World';
      expect(normalizeMessage(text)).toBe('Hello World');
    });

    it('handles single spaces correctly', () => {
      expect(normalizeMessage('a b c')).toBe('a b c');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(normalizeMessage('   ')).toBe('');
      expect(normalizeMessage('\t\n')).toBe('');
    });
  });

  describe('isValidMessage', () => {
    it('accepts message with MIN_LEN character', () => {
      expect(isValidMessage('a')).toBe(true);
    });

    it('accepts message with MAX_LEN characters', () => {
      expect(isValidMessage('a'.repeat(MAX_LEN))).toBe(true);
    });

    it('rejects empty message', () => {
      expect(isValidMessage('')).toBe(false);
    });

    it('rejects whitespace-only message', () => {
      expect(isValidMessage('   ')).toBe(false);
    });

    it('rejects message over MAX_LEN', () => {
      expect(isValidMessage('a'.repeat(MAX_LEN + 1))).toBe(false);
    });

    it('accepts valid Korean message', () => {
      expect(isValidMessage('우리 팀 우승!')).toBe(true);
    });

    it('accepts mixed Korean and English', () => {
      expect(isValidMessage('Go 팀!')).toBe(true);
    });

    it('normalizes before validating', () => {
      expect(isValidMessage('  hello  ')).toBe(true);
      expect(isValidMessage('a   b')).toBe(true);
    });
  });
});
