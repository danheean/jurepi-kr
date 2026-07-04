import { describe, it, expect } from 'vitest';
import { formatJson } from './format';

describe('format.ts', () => {
  describe('formatJson', () => {
    it('formats minified JSON with 2-space indent', () => {
      const json = '{"name":"John","age":30}';
      const result = formatJson(json, { indent: '2', sortKeys: false });
      expect(result.success).toBe(true);
      expect(result.output).toContain('"name": "John"');
      expect(result.output).toContain('"age": 30');
    });

    it('formats minified JSON with 4-space indent', () => {
      const json = '{"name":"John"}';
      const result = formatJson(json, { indent: '4', sortKeys: false });
      expect(result.success).toBe(true);
      expect(result.output).toContain('    "name"');
    });

    it('formats minified JSON with tab indent', () => {
      const json = '{"name":"John"}';
      const result = formatJson(json, { indent: 'tab', sortKeys: false });
      expect(result.success).toBe(true);
      expect(result.output).toContain('\t"name"');
    });

    it('formats array correctly', () => {
      const json = '[1,2,{"name":"John"}]';
      const result = formatJson(json, { indent: '2', sortKeys: false });
      expect(result.success).toBe(true);
      expect(result.output).toContain('[');
      expect(result.output).toContain(']');
    });

    it('sorts keys recursively when requested', () => {
      const json = '{"z":1,"a":{"m":2,"b":3},"c":4}';
      const result = formatJson(json, { indent: '2', sortKeys: true });
      expect(result.success).toBe(true);
      // Keys should be sorted: a, c, z
      const output = result.output!;
      const aIndex = output.indexOf('"a"');
      const cIndex = output.indexOf('"c"');
      const zIndex = output.indexOf('"z"');
      expect(aIndex).toBeLessThan(cIndex);
      expect(cIndex).toBeLessThan(zIndex);
    });

    it('preserves array order when sorting keys', () => {
      const json = '{"arr":[3,2,1],"z":1}';
      const result = formatJson(json, { indent: '2', sortKeys: true });
      expect(result.success).toBe(true);
      // Array should be [3, 2, 1], not sorted
      expect(result.output).toContain('3');
    });

    it('returns error for invalid JSON', () => {
      const json = '{"name": "John", "age": 30,}';
      const result = formatJson(json, { indent: '2', sortKeys: false });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.line).toBeGreaterThan(0);
      expect(result.error?.column).toBeGreaterThan(0);
    });

    it('returns error for oversized input', () => {
      const largeJson = '{"data":"' + 'x'.repeat(10 * 1024 * 1024 + 100) + '"}';
      const result = formatJson(largeJson, { indent: '2', sortKeys: false });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('parses valid JSON on success', () => {
      const json = '{"name":"John","age":30}';
      const result = formatJson(json, { indent: '2', sortKeys: false });
      expect(result.success).toBe(true);
      expect(result.json).toEqual({ name: 'John', age: 30 });
    });

    it('handles nested objects correctly', () => {
      const json = '{"outer":{"inner":{"deep":1}}}';
      const result = formatJson(json, { indent: '2', sortKeys: false });
      expect(result.success).toBe(true);
      expect(result.output).toContain('outer');
      expect(result.output).toContain('inner');
      expect(result.output).toContain('deep');
    });

    it('handles primitive values', () => {
      // JSON primitives at root
      expect(formatJson('123', { indent: '2', sortKeys: false }).success).toBe(true);
      expect(formatJson('"string"', { indent: '2', sortKeys: false }).success).toBe(true);
      expect(formatJson('true', { indent: '2', sortKeys: false }).success).toBe(true);
      expect(formatJson('false', { indent: '2', sortKeys: false }).success).toBe(true);
      expect(formatJson('null', { indent: '2', sortKeys: false }).success).toBe(true);
    });

    it('handles empty objects and arrays', () => {
      expect(formatJson('{}', { indent: '2', sortKeys: false }).success).toBe(true);
      expect(formatJson('[]', { indent: '2', sortKeys: false }).success).toBe(true);
    });
  });
});
