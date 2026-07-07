import { describe, it, expect } from 'vitest';
import { applyRules } from './apply';
import type { Rule } from './schema';

describe('apply.ts', () => {
  describe('applyRules sequential application', () => {
    it('applies rules in order', () => {
      const rule1: Rule = {
        id: '1',
        find: '고양이',
        replace: '호랑이',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const rule2: Rule = {
        id: '2',
        find: '호랑이',
        replace: '사자',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('고양이', [rule1, rule2]);
      expect(result.output).toBe('사자');
      expect(result.totalCount).toBe(2); // 1 from rule1 + 1 from rule2
      expect(result.perRuleCounts[0].count).toBe(1);
      expect(result.perRuleCounts[1].count).toBe(1);
    });

    it('skips disabled rules', () => {
      const rule1: Rule = {
        id: '1',
        find: 'a',
        replace: 'b',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: false,
      };
      const rule2: Rule = {
        id: '2',
        find: 'b',
        replace: 'c',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('ab', [rule1, rule2]);
      expect(result.output).toBe('ac'); // rule1 skipped, rule2 applies to 'ab'
      expect(result.perRuleCounts[0].count).toBe(0); // rule1 skipped
      expect(result.perRuleCounts[1].count).toBe(1); // rule2 matched and replaced
    });

    it('continues after error in one rule', () => {
      const rule1: Rule = {
        id: '1',
        find: '(',
        replace: 'x',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const rule2: Rule = {
        id: '2',
        find: 'b',
        replace: 'c',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('abc', [rule1, rule2]);
      // rule1 has invalid regex, so it's skipped (text stays 'abc')
      // rule2 applies to 'abc'
      expect(result.output).toBe('acc');
      expect(result.perRuleCounts[0].error?.code).toBe('invalid_pattern');
      expect(result.perRuleCounts[0].count).toBe(0);
      expect(result.perRuleCounts[1].count).toBe(1);
    });

    it('accumulates replacement counts', () => {
      const rule1: Rule = {
        id: '1',
        find: 'a',
        replace: 'b',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const rule2: Rule = {
        id: '2',
        find: 'b',
        replace: 'c',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('aaa', [rule1, rule2]);
      expect(result.totalCount).toBe(6); // 3 from rule1 (a→b), 3 from rule2 (b→c)
      expect(result.output).toBe('ccc');
    });

    it('handles empty rule list', () => {
      const result = applyRules('hello', []);
      expect(result.output).toBe('hello');
      expect(result.totalCount).toBe(0);
      expect(result.perRuleCounts).toHaveLength(0);
    });

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
      const result = applyRules('', [rule]);
      expect(result.output).toBe('');
      expect(result.totalCount).toBe(0);
    });

    it('handles mixed literal and regex rules', () => {
      const rule1: Rule = {
        id: '1',
        find: 'date',
        replace: 'DATE',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const rule2: Rule = {
        id: '2',
        find: '(\\d{4})-(\\d{2})-(\\d{2})',
        replace: '$3/$2/$1',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('date 2026-07-07', [rule1, rule2]);
      expect(result.output).toBe('DATE 07/07/2026');
      expect(result.totalCount).toBe(2);
    });

    it('respects per-rule options (firstOnly)', () => {
      const rule1: Rule = {
        id: '1',
        find: 'a',
        replace: 'b',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: true, // First only
        enabled: true,
      };
      const rule2: Rule = {
        id: '2',
        find: 'b',
        replace: 'c',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false, // Replace all
        enabled: true,
      };

      const result = applyRules('aaa', [rule1, rule2]);
      // rule1: replace first 'a' → 'baa'
      // rule2: replace all 'b' in 'baa' → 'caa'
      expect(result.output).toBe('caa');
      expect(result.perRuleCounts[0].count).toBe(1);
      expect(result.perRuleCounts[1].count).toBe(1);
    });

    it('correctly builds spans from final output', () => {
      const rule1: Rule = {
        id: '1',
        find: '\\d',
        replace: 'X',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('1 2 3', [rule1]);
      // Regex rule returns spans
      expect(result.spans).toBeDefined();
      expect(result.spans.length).toBeGreaterThan(0);
      expect(result.output).toBe('X X X');
    });

    it('spans point at the replacement text in the final output (literal, single rule)', () => {
      const rule: Rule = {
        id: '1', find: 'a', replace: 'bb', isRegex: false,
        caseSensitive: false, wholeWord: false, firstOnly: false, enabled: true,
      };
      const result = applyRules('aaa', [rule]);
      expect(result.output).toBe('bbbbbb');
      const highlighted = result.spans.map((s) => result.output.slice(s.index, s.index + s.length));
      expect(highlighted).toEqual(['bb', 'bb', 'bb']);
    });

    it('remaps prior spans through later rules (multi-rule final-output coordinates)', () => {
      const base = {
        isRegex: false, caseSensitive: false, wholeWord: false, firstOnly: false, enabled: true,
      };
      const result = applyRules('고양이가 강아지를 만났다.', [
        { id: '1', find: '고양이', replace: '호랑이', ...base },
        { id: '2', find: '강아지', replace: '여우', ...base },
      ]);
      expect(result.output).toBe('호랑이가 여우를 만났다.');
      // Each span must slice to a replacement string on the FINAL output, not a stale position.
      const highlighted = result.spans.map((s) => result.output.slice(s.index, s.index + s.length));
      expect(highlighted).toContain('호랑이');
      expect(highlighted).toContain('여우');
    });

    it('expands regex capture groups in the replacement and highlights the result', () => {
      const rule: Rule = {
        id: '1', find: '(\\d{4})-(\\d{2})-(\\d{2})', replace: '$3/$2/$1', isRegex: true,
        caseSensitive: true, wholeWord: false, firstOnly: false, enabled: true, flags: '',
      };
      const result = applyRules('2026-07-07', [rule]);
      expect(result.output).toBe('07/07/2026');
      expect(result.spans.map((s) => result.output.slice(s.index, s.index + s.length))).toEqual(['07/07/2026']);
    });

    it('chains multiple transformations', () => {
      const rules: Rule[] = [
        {
          id: '1',
          find: 'a',
          replace: 'b',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
        {
          id: '2',
          find: 'b',
          replace: 'c',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
        {
          id: '3',
          find: 'c',
          replace: 'd',
          isRegex: false,
          caseSensitive: true,
          wholeWord: false,
          firstOnly: false,
          enabled: true,
        },
      ];

      const result = applyRules('a', rules);
      expect(result.output).toBe('d');
      expect(result.totalCount).toBe(3);
    });
  });

  describe('error handling', () => {
    it('collects error from invalid regex rule', () => {
      const rule: Rule = {
        id: '1',
        find: '[invalid',
        replace: 'x',
        isRegex: true,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };

      const result = applyRules('text', [rule]);
      expect(result.perRuleCounts[0].error).toBeDefined();
      expect(result.perRuleCounts[0].error?.code).toBe('invalid_pattern');
      expect(result.output).toBe('text'); // Text unchanged after error
    });
  });

  describe('applyRules deadline', () => {
    it('sets timedOut and stops when the shared deadline is already past', () => {
      const rule: Rule = {
        id: 'r',
        find: 'a',
        replace: 'b',
        isRegex: false,
        caseSensitive: true,
        wholeWord: false,
        firstOnly: false,
        enabled: true,
      };
      const result = applyRules('aaa', [rule], { deadlineMs: -1 });
      expect(result.timedOut).toBe(true);
      expect(result.output).toBe('aaa'); // never applied
      expect(result.totalCount).toBe(0);
    });
  });
});
