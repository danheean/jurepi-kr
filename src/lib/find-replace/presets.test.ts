import { describe, it, expect } from 'vitest';
import { PRESETS } from './presets';
import { applyRules } from './apply';
import { applyTransform } from './transforms';
import type { TransformId } from './schema';

describe('presets.ts', () => {
  describe('PRESETS structural invariants', () => {
    it('has a non-empty preset list', () => {
      expect(PRESETS.length).toBeGreaterThan(0);
    });

    it('has unique ids', () => {
      const ids = PRESETS.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every preset has a labelKey', () => {
      PRESETS.forEach((p) => {
        expect(p.labelKey.length).toBeGreaterThan(0);
      });
    });

    it('labelKey is a relative key (not the wrong `find-replace.` namespace)', () => {
      // Components consume via useTranslations('tools.find-replace') + t(labelKey),
      // so labelKey must be relative (e.g. "preset.toJsString"), never a rooted namespace.
      PRESETS.forEach((p) => {
        expect(p.labelKey.startsWith('find-replace.')).toBe(false);
        expect(p.labelKey.startsWith('tools.')).toBe(false);
        expect(p.labelKey.startsWith('preset.')).toBe(true);
      });
    });

    it('kind matches the presence of rules vs transform', () => {
      PRESETS.forEach((p) => {
        if (p.kind === 'ruleset') {
          expect(Array.isArray(p.rules)).toBe(true);
          expect(p.rules!.length).toBeGreaterThan(0);
          expect(p.transform).toBeUndefined();
        } else {
          expect(typeof p.transform).toBe('string');
          expect(p.rules).toBeUndefined();
        }
      });
    });
  });

  describe('builtin presets', () => {
    it('every builtin transform id is dispatchable and does not throw', () => {
      const sample = '  Hello，  world！\n\n  "quote"  \n1. item';
      PRESETS.filter((p) => p.kind === 'builtin').forEach((p) => {
        const id = p.transform as TransformId;
        expect(() => applyTransform(id, sample)).not.toThrow();
        expect(typeof applyTransform(id, sample)).toBe('string');
      });
    });

    it('to-js-string then from-js-string round-trips representable text', () => {
      const cases = ['hello\nworld', '한글\t줄\r바뀜', '', 'quotes " and \\ backslash'];
      cases.forEach((original) => {
        const encoded = applyTransform('to-js-string', original);
        const decoded = applyTransform('from-js-string', encoded);
        expect(decoded).toBe(original);
      });
    });

    it('strip-blank-lines removes whitespace-only lines', () => {
      expect(applyTransform('strip-blank-lines', 'a\n\n  \nb')).toBe('a\nb');
    });

    it('collapse-spaces collapses runs of spaces to one', () => {
      expect(applyTransform('collapse-spaces', 'a    b   c')).toBe('a b c');
    });
  });

  describe('ruleset presets', () => {
    it('every ruleset preset applies without a per-rule error on a sample', () => {
      const sample = '  padded line  \nsee https://jurepi.kr now  ';
      PRESETS.filter((p) => p.kind === 'ruleset').forEach((p) => {
        const result = applyRules(sample, p.rules!);
        result.perRuleCounts.forEach((rc) => {
          expect(rc.error).toBeUndefined();
        });
      });
    });

    it('trim-spaces removes leading/trailing spaces on each line', () => {
      const preset = PRESETS.find((p) => p.id === 'trim-spaces');
      expect(preset).toBeDefined();
      const result = applyRules('  hello  \n  world  ', preset!.rules!);
      expect(result.output).toBe('hello\nworld');
    });

    it('url-to-markdown-link wraps a bare URL as a markdown link', () => {
      const preset = PRESETS.find((p) => p.id === 'url-to-markdown-link');
      expect(preset).toBeDefined();
      const result = applyRules('go to https://jurepi.kr today', preset!.rules!);
      expect(result.output).toContain('[https://jurepi.kr](https://jurepi.kr)');
    });
  });
});
