import { describe, it, expect } from 'vitest';
import { compile, compileForValidation } from './compile';

describe('compile.ts', () => {
  describe('compile', () => {
    it('compiles valid pattern', () => {
      const result = compile('hello');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.source).toBe('hello');
        expect(result.regex.flags).toContain('g');
      }
    });

    it('compiles pattern with capture groups', () => {
      const result = compile('(\\d+)-(\\d+)');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.source).toBe('(\\d+)-(\\d+)');
      }
    });

    it('adds global flag by default', () => {
      const result = compile('test');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.global).toBe(true);
      }
    });

    it('does not add global flag when firstOnly is true', () => {
      const result = compile('test', '', true);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.global).toBe(false);
      }
    });

    it('compiles with flags', () => {
      const result = compile('hello', 'i');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.flags).toContain('i');
        expect(result.regex.flags).toContain('g');
      }
    });

    it('compiles with multiple flags', () => {
      const result = compile('test', 'im');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.flags).toContain('i');
        expect(result.regex.flags).toContain('m');
        expect(result.regex.flags).toContain('g');
      }
    });

    it('rejects invalid flag', () => {
      const result = compile('test', 'x');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_pattern');
        expect(result.error.message).toContain('x');
      }
    });

    it('rejects duplicate flags', () => {
      const result = compile('test', 'ii');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_pattern');
      }
    });

    it('rejects invalid pattern', () => {
      const result = compile('(invalid');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_pattern');
        expect(result.error.pattern).toBe('(invalid');
      }
    });

    it('rejects pattern with unmatched ]', () => {
      const result = compile('[a-z');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_pattern');
      }
    });

    it('handles empty pattern', () => {
      const result = compile('');
      expect(result.ok).toBe(true);
      if (result.ok) {
        // JS engine optimizes empty pattern to (?:)
        const source = result.regex.source;
        expect(source === '' || source === '(?:)').toBe(true);
      }
    });

    it('compiles pattern with lookahead', () => {
      const result = compile('\\d+(?=px)');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.test('100px')).toBe(true);
      }
    });

    it('compiles pattern with lookbehind (if JS engine supports)', () => {
      const result = compile('(?<=\\$)\\d+');
      expect(result.ok).toBe(true);
    });

    it('compiles pattern with named groups', () => {
      const result = compileForValidation('(?<year>\\d{4})-(?<month>\\d{2})');
      expect(result.ok).toBe(true);
      if (result.ok) {
        const match = result.regex.exec('2026-07');
        expect(match).not.toBeNull();
        if (match) {
          expect(match.groups?.year).toBe('2026');
          expect(match.groups?.month).toBe('07');
        }
      }
    });
  });

  describe('compileForValidation', () => {
    it('does not add global flag', () => {
      const result = compileForValidation('test');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.regex.global).toBe(false);
      }
    });

    it('still validates flags', () => {
      const result = compileForValidation('test', 'x');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_pattern');
      }
    });
  });
});
