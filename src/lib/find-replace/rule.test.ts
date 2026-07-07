import { describe, it, expect } from 'vitest';
import { applyRule } from './rule';
import type { Rule } from './schema';

describe('rule.ts', () => {
  describe('applyRule literal mode', () => {
    it('replaces all matches', () => {
      const rule: Rule = {
        id: '1',
        find: 'hello',
        replace: 'world',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('hello hello', rule);
      expect(result.text).toBe('world world');
      expect(result.count).toBe(2);
    });

    it('respects case-sensitive option', () => {
      const rule: Rule = {
        id: '1',
        find: 'Test',
        replace: 'REPLACED',
        isRegex: false,
        caseSensitive: false,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('Test test TEST', rule);
      expect(result.text).toBe('REPLACED REPLACED REPLACED');
      expect(result.count).toBe(3);
    });

    it('respects caseSensitive=true', () => {
      const rule: Rule = {
        id: '1',
        find: 'Test',
        replace: 'X',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('Test test TEST', rule);
      expect(result.text).toBe('X test TEST');
      expect(result.count).toBe(1);
    });

    it('respects firstOnly option', () => {
      const rule: Rule = {
        id: '1',
        find: 'a',
        replace: 'b',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: true,
        enabled: true,
      };
      const result = applyRule('aaa', rule);
      expect(result.text).toBe('baa');
      expect(result.count).toBe(1);
    });

    it('skips empty find', () => {
      const rule: Rule = {
        id: '1',
        find: '',
        replace: 'x',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('text', rule);
      expect(result.text).toBe('text');
      expect(result.count).toBe(0);
      expect(result.error).toBeUndefined();
    });

    it('skips disabled rule', () => {
      const rule: Rule = {
        id: '1',
        find: 'hello',
        replace: 'world',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: false,
      };
      const result = applyRule('hello world', rule);
      expect(result.text).toBe('hello world');
      expect(result.count).toBe(0);
    });

    it('handles CJK characters', () => {
      const rule: Rule = {
        id: '1',
        find: '고양이',
        replace: '호랑이',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('고양이가 고양이를', rule);
      expect(result.text).toBe('호랑이가 호랑이를');
      expect(result.count).toBe(2);
    });

    it('handles emojis', () => {
      const rule: Rule = {
        id: '1',
        find: '👋',
        replace: '👍',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('👋 👋 👋', rule);
      expect(result.text).toBe('👍 👍 👍');
      expect(result.count).toBe(3);
    });

    it('respects wholeWord option (literal)', () => {
      const rule: Rule = {
        id: '1',
        find: 'test',
        replace: 'X',
        isRegex: false,
        caseSensitive: true,
        wholeWord: true,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('test testing tested', rule);
      // Should only replace 'test' as whole word
      expect(result.text).toContain('X');
      expect(result.count).toBe(1);
    });

    it('handles $ in replacement (literal mode)', () => {
      const rule: Rule = {
        id: '1',
        find: 'old',
        replace: '$1',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('old', rule);
      // In literal mode, $1 should be treated as literal $1, not a group reference
      expect(result.text).toBe('$1');
      expect(result.count).toBe(1);
    });

    it('handles multiple $ in replacement', () => {
      const rule: Rule = {
        id: '1',
        find: 'X',
        replace: '$$$',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('X', rule);
      // In literal mode, replace '$$$' with literal '$$$'
      // escapeReplacement turns '$$$' into '$$$$$$' for String.replace
      // String.replace then interprets '$$$$$$' as '$$$'
      expect(result.text).toBe('$$$');
      expect(result.count).toBe(1);
    });
  });

  describe('applyRule regex mode', () => {
    it('supports capture groups with $1', () => {
      const rule: Rule = {
        id: '1',
        find: '(\\d{4})-(\\d{2})-(\\d{2})',
        replace: '$3/$2/$1',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('2026-07-07', rule);
      expect(result.text).toBe('07/07/2026');
      expect(result.count).toBe(1);
    });

    it('handles invalid regex pattern', () => {
      const rule: Rule = {
        id: '1',
        find: '(',
        replace: 'x',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('text', rule);
      expect(result.error?.code).toBe('invalid_pattern');
      expect(result.text).toBe('text');
      expect(result.count).toBe(0);
    });

    it('supports case-insensitive flag', () => {
      const rule: Rule = {
        id: '1',
        find: 'hello',
        replace: 'HELLO',
        isRegex: true,
        caseSensitive: false,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
        flags: 'i',
      };
      const result = applyRule('Hello HELLO hello', rule);
      expect(result.text).toBe('HELLO HELLO HELLO');
      expect(result.count).toBe(3);
    });

    it('handles lookahead', () => {
      const rule: Rule = {
        id: '1',
        find: '\\d+(?=px)',
        replace: 'WIDTH',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('100px 200em 300px', rule);
      expect(result.text).toBe('WIDTHpx 200em WIDTHpx');
      expect(result.count).toBe(2);
    });

    it('prevents infinite loop on zero-length match', () => {
      const rule: Rule = {
        id: '1',
        find: 'a*',
        replace: 'X',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('aaa', rule);
      // Should not infinite loop
      expect(result.count).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
      // Result depends on how the regex engine handles a* — should be finite
      expect(result.text.length).toBeGreaterThan(0);
    });

    it('respects firstOnly in regex mode', () => {
      const rule: Rule = {
        id: '1',
        find: '\\d',
        replace: 'N',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: true,
        enabled: true,
      };
      const result = applyRule('1 2 3', rule);
      expect(result.text).toBe('N 2 3');
      expect(result.count).toBe(1);
    });

    it('handles named capture groups', () => {
      const rule: Rule = {
        id: '1',
        find: '(?<year>\\d{4})-(?<month>\\d{2})',
        replace: '$<month>/$<year>',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('2026-07', rule);
      expect(result.text).toBe('07/2026');
      expect(result.count).toBe(1);
    });

    it('handles $& (full match)', () => {
      const rule: Rule = {
        id: '1',
        find: '\\d+',
        replace: '[$&]',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('100 200', rule);
      expect(result.text).toBe('[100] [200]');
      expect(result.count).toBe(2);
    });

    it('handles $$ (literal $)', () => {
      const rule: Rule = {
        id: '1',
        find: '\\d+',
        replace: '$$',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('100', rule);
      expect(result.text).toBe('$');
      expect(result.count).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty text', () => {
      const rule: Rule = {
        id: '1',
        find: 'test',
        replace: 'x',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('', rule);
      expect(result.text).toBe('');
      expect(result.count).toBe(0);
    });

    it('handles text with combining marks', () => {
      const rule: Rule = {
        id: '1',
        find: 'é',
        replace: 'e',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRule('café', rule);
      expect(result.text).toContain('e');
    });

    it('handles regex with multiline flag', () => {
      const rule: Rule = {
        id: '1',
        find: '^line',
        replace: 'LINE',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
        flags: 'm',
      };
      const result = applyRule('line1\nline2\nline3', rule);
      expect(result.count).toBe(3);
    });
  });

  describe('applyRule ReDoS guard + regex edge branches', () => {
    const base: Rule = {
      id: 'r',
      find: '',
      replace: '',
      isRegex: true,
      caseSensitive: true,
      wholeWord: false,
      firstOnly: false,
      enabled: true,
    };

    it('returns a timeout error when the deadline is already past', () => {
      const rule: Rule = { ...base, find: 'a+', replace: 'b' };
      const result = applyRule('aaaaaa', rule, { deadlineMs: -1 });
      expect(result.count).toBe(0);
      expect(result.text).toBe('aaaaaa'); // unchanged
      expect(result.error?.code).toBe('invalid_pattern');
      expect(result.error?.message).toMatch(/timed out/i);
    });

    it('advances past zero-length matches without looping forever', () => {
      // "x*" matches an empty string at every position of "abc" → all zero-length.
      // The SPEC invariant is that this TERMINATES (no infinite loop) with a bounded
      // count; the output follows native String.replace semantics for zero-length.
      const rule: Rule = { ...base, find: 'x*', replace: 'Z' };
      const result = applyRule('abc', rule);
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(result.count).toBeLessThan(10); // finite: no runaway loop
      expect(typeof result.text).toBe('string');
      expect(result.error).toBeUndefined();
    });

    it('replaces only the first match in regex firstOnly mode', () => {
      const rule: Rule = { ...base, find: '\\d+', replace: 'N', firstOnly: true };
      const result = applyRule('12 and 34', rule);
      expect(result.count).toBe(1);
      expect(result.text).toBe('N and 34');
    });
  });
});
