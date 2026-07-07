import { describe, it, expect } from 'vitest';
import {
  toJsString,
  fromJsString,
  normalizeQuotes,
  fullwidthToHalfwidth,
  stripBlankLines,
  collapseSpaces,
  stripLineNumbers,
  linesToArrayItems,
  applyTransform,
} from './transforms';

describe('transforms.ts', () => {
  describe('toJsString / fromJsString round-trip', () => {
    it('round-trips simple text', () => {
      const original = 'hello world';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips text with newline', () => {
      const original = 'hello\nworld';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips text with tab', () => {
      const original = 'hello\tworld';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips text with backslash', () => {
      const original = 'hello\\world';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips text with quotes', () => {
      const original = 'hello "world"';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips text with CJK', () => {
      const original = '한글\n줄\n바뀜';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips text with emoji', () => {
      const original = 'hello 👋 world';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('round-trips empty string', () => {
      const original = '';
      const jsStr = toJsString(original);
      const restored = fromJsString(jsStr);
      expect(restored).toBe(original);
    });

    it('toJsString wraps in quotes', () => {
      const result = toJsString('test');
      expect(result.startsWith('"')).toBe(true);
      expect(result.endsWith('"')).toBe(true);
    });
  });

  describe('normalizeQuotes', () => {
    it('converts em dash to minus', () => {
      // U+2014 em dash → minus
      expect(normalizeQuotes('hello—world')).toBe('hello-world');
    });

    it('preserves straight quotes', () => {
      expect(normalizeQuotes('"hello"')).toBe('"hello"');
      expect(normalizeQuotes("'hello'")).toBe("'hello'");
    });

    it('handles mixed text', () => {
      expect(normalizeQuotes('say "hello" friend')).toBe('say "hello" friend');
    });
  });

  describe('fullwidthToHalfwidth', () => {
    it('converts fullwidth punctuation', () => {
      expect(fullwidthToHalfwidth('！')).toBe('!');
      expect(fullwidthToHalfwidth('？')).toBe('?');
      expect(fullwidthToHalfwidth('，')).toBe(',');
      expect(fullwidthToHalfwidth('。')).toBe('.');
    });

    it('converts fullwidth brackets', () => {
      expect(fullwidthToHalfwidth('（')).toBe('(');
      expect(fullwidthToHalfwidth('）')).toBe(')');
    });

    it('converts fullwidth space', () => {
      expect(fullwidthToHalfwidth('　')).toBe(' ');
    });

    it('handles mixed text', () => {
      expect(fullwidthToHalfwidth('こんにちは！')).toBe('こんにちは!');
    });

    it('preserves non-convertible characters', () => {
      expect(fullwidthToHalfwidth('hello')).toBe('hello');
      expect(fullwidthToHalfwidth('123')).toBe('123');
    });
  });

  describe('stripBlankLines', () => {
    it('removes blank lines', () => {
      expect(stripBlankLines('line1\n\nline2')).toBe('line1\nline2');
    });

    it('removes lines with only whitespace', () => {
      expect(stripBlankLines('line1\n   \nline2')).toBe('line1\nline2');
    });

    it('preserves non-blank lines', () => {
      expect(stripBlankLines('line1\nline2\nline3')).toBe('line1\nline2\nline3');
    });

    it('handles single line', () => {
      expect(stripBlankLines('single line')).toBe('single line');
    });

    it('handles all blank lines', () => {
      expect(stripBlankLines('\n\n\n')).toBe('');
    });
  });

  describe('collapseSpaces', () => {
    it('collapses multiple spaces into one', () => {
      expect(collapseSpaces('hello    world')).toBe('hello world');
    });

    it('preserves single spaces', () => {
      expect(collapseSpaces('hello world')).toBe('hello world');
    });

    it('preserves newlines', () => {
      expect(collapseSpaces('hello    world\nfoo   bar')).toBe('hello world\nfoo bar');
    });

    it('handles tab as non-space', () => {
      expect(collapseSpaces('hello  \t  world')).toBe('hello \t world');
    });
  });

  describe('stripLineNumbers', () => {
    it('strips line numbers with period', () => {
      expect(stripLineNumbers('1. first\n2. second')).toBe('first\nsecond');
    });

    it('strips line numbers with colon', () => {
      expect(stripLineNumbers('1: first\n2: second')).toBe('first\nsecond');
    });

    it('strips line numbers with bracket', () => {
      expect(stripLineNumbers('[1] first\n[2] second')).toBe('first\nsecond');
    });

    it('strips leading whitespace after number', () => {
      expect(stripLineNumbers('1.   first\n2.   second')).toBe('first\nsecond');
    });

    it('preserves non-numbered lines', () => {
      expect(stripLineNumbers('not numbered\nneither')).toBe('not numbered\nneither');
    });

    it('handles mixed formats', () => {
      expect(stripLineNumbers('1. first\n2: second\n[3] third')).toBe(
        'first\nsecond\nthird'
      );
    });
  });

  describe('linesToArrayItems', () => {
    it('converts lines to quoted array items', () => {
      const result = linesToArrayItems('apple\nbanana');
      expect(result).toContain('"apple",');
      expect(result).toContain('"banana",');
    });

    it('filters out blank lines', () => {
      const result = linesToArrayItems('apple\n\nbanana');
      expect(result).not.toContain('""');
    });

    it('handles single line', () => {
      const result = linesToArrayItems('apple');
      expect(result).toBe('"apple",');
    });

    it('joins with newlines', () => {
      const result = linesToArrayItems('apple\nbanana\ncherry');
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
    });

    it('preserves spaces within lines', () => {
      const result = linesToArrayItems('hello world\nfoo bar');
      expect(result).toContain('"hello world",');
      expect(result).toContain('"foo bar",');
    });
  });

  describe('fromJsString edge/fallback branches', () => {
    it('returns non-quoted input unchanged (graceful fallback)', () => {
      expect(fromJsString('not a quoted literal')).toBe('not a quoted literal');
    });

    it('returns too-short input unchanged', () => {
      expect(fromJsString('"')).toBe('"');
      expect(fromJsString('')).toBe('');
    });

    it('keeps an unknown escape as-is', () => {
      // \x is not a recognized simple escape here → kept literally
      expect(fromJsString('"a\\xb"')).toBe('a\\xb');
    });

    it('handles a trailing backslash inside the quotes', () => {
      expect(fromJsString('"end\\"')).toBe('end\\');
    });
  });

  describe('applyTransform dispatch', () => {
    it('dispatches every transform id without throwing', () => {
      const ids = [
        'to-js-string',
        'from-js-string',
        'normalize-quotes',
        'fullwidth-to-halfwidth',
        'strip-blank-lines',
        'collapse-spaces',
        'strip-line-numbers',
        'lines-to-array-items',
      ] as const;
      ids.forEach((id) => {
        expect(() => applyTransform(id, 'sample\ntext')).not.toThrow();
      });
    });

    it('to-js-string dispatch matches direct call', () => {
      expect(applyTransform('to-js-string', 'x\ny')).toBe(toJsString('x\ny'));
    });
  });
});
