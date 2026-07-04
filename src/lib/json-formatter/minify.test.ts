import { describe, it, expect } from 'vitest';
import { minifyJson } from './minify';

describe('minify.ts', () => {
  describe('minifyJson', () => {
    it('removes whitespace from formatted JSON', () => {
      const json = '{\n  "name": "John",\n  "age": 30\n}';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      expect(result.output).toBe('{"name":"John","age":30}');
    });

    it('handles already minified JSON', () => {
      const json = '{"name":"John","age":30}';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      expect(result.output).toBe(json);
    });

    it('minifies arrays', () => {
      const json = '[\n  1,\n  2,\n  3\n]';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      expect(result.output).toBe('[1,2,3]');
    });

    it('preserves nested structure', () => {
      const json = '{\n  "outer": {\n    "inner": [1, 2, 3]\n  }\n}';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.output!);
      expect(parsed.outer.inner).toEqual([1, 2, 3]);
    });

    it('returns error for invalid JSON', () => {
      const json = '{"name": "John",}';
      const result = minifyJson(json);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error for oversized input', () => {
      const largeJson = '{"data":"' + 'x'.repeat(10 * 1024 * 1024 + 100) + '"}';
      const result = minifyJson(largeJson);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('parses JSON correctly on success', () => {
      const json = '{\n  "name": "John",\n  "age": 30\n}';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      expect(result.json).toEqual({ name: 'John', age: 30 });
    });

    it('handles escaped characters', () => {
      const json = '{"text":"hello\\"world"}';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      expect(result.output).toContain('\\"');
    });

    it('handles unicode characters', () => {
      const json = '{"emoji":"😊"}';
      const result = minifyJson(json);
      expect(result.success).toBe(true);
      expect(result.json.emoji).toBe('😊');
    });
  });
});
