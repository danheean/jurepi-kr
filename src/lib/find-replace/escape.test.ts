import { describe, it, expect } from 'vitest';
import { escapeRegExp, escapeReplacement } from './escape';

describe('escape.ts', () => {
  describe('escapeRegExp', () => {
    it('escapes regex metacharacters', () => {
      expect(escapeRegExp('.')).toBe('\\.');
      expect(escapeRegExp('^')).toBe('\\^');
      expect(escapeRegExp('$')).toBe('\\$');
      expect(escapeRegExp('*')).toBe('\\*');
      expect(escapeRegExp('+')).toBe('\\+');
      expect(escapeRegExp('?')).toBe('\\?');
      expect(escapeRegExp('{')).toBe('\\{');
      expect(escapeRegExp('}')).toBe('\\}');
      expect(escapeRegExp('[')).toBe('\\[');
      expect(escapeRegExp(']')).toBe('\\]');
      expect(escapeRegExp('(')).toBe('\\(');
      expect(escapeRegExp(')')).toBe('\\)');
      expect(escapeRegExp('|')).toBe('\\|');
      expect(escapeRegExp('\\')).toBe('\\\\');
    });

    it('does not escape non-metacharacters', () => {
      expect(escapeRegExp('hello')).toBe('hello');
      expect(escapeRegExp('123')).toBe('123');
      expect(escapeRegExp('hello world')).toBe('hello world');
    });

    it('escapes multiple metacharacters', () => {
      expect(escapeRegExp('a.b*c+d?')).toBe('a\\.b\\*c\\+d\\?');
      expect(escapeRegExp('$1')).toBe('\\$1');
      expect(escapeRegExp('(test)')).toBe('\\(test\\)');
    });

    it('handles empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });

    it('handles CJK characters', () => {
      expect(escapeRegExp('한글')).toBe('한글');
      expect(escapeRegExp('中文')).toBe('中文');
      expect(escapeRegExp('日本語')).toBe('日本語');
    });

    it('handles emojis', () => {
      expect(escapeRegExp('👋')).toBe('👋');
      expect(escapeRegExp('hello 👋 world')).toBe('hello 👋 world');
    });

    it('handles mixed content', () => {
      expect(escapeRegExp('한글.test*')).toBe('한글\\.test\\*');
    });
  });

  describe('escapeReplacement', () => {
    it('escapes $ as $$', () => {
      expect(escapeReplacement('$')).toBe('$$');
      expect(escapeReplacement('$$')).toBe('$$$$');
    });

    it('escapes $1 correctly for literal mode', () => {
      expect(escapeReplacement('$1')).toBe('$$1');
      expect(escapeReplacement('$2')).toBe('$$2');
      expect(escapeReplacement('$<name>')).toBe('$$<name>');
    });

    it('does not escape other characters', () => {
      expect(escapeReplacement('hello')).toBe('hello');
      expect(escapeReplacement('test123')).toBe('test123');
      expect(escapeReplacement('hello world')).toBe('hello world');
    });

    it('escapes multiple $', () => {
      expect(escapeReplacement('$1 and $2')).toBe('$$1 and $$2');
      expect(escapeReplacement('price: $100')).toBe('price: $$100');
    });

    it('handles empty string', () => {
      expect(escapeReplacement('')).toBe('');
    });

    it('handles CJK characters', () => {
      expect(escapeReplacement('한글')).toBe('한글');
      expect(escapeReplacement('한글$교체')).toBe('한글$$교체');
    });

    it('handles emojis', () => {
      expect(escapeReplacement('👋')).toBe('👋');
      expect(escapeReplacement('$100👋')).toBe('$$100👋');
    });

    it('round-trip: literal mode preserves $', () => {
      const original = '$1 and $2';
      const escaped = escapeReplacement(original);
      const replacementString = 'test'.replace(/test/g, escaped);
      expect(replacementString).toBe(original);
    });
  });
});
