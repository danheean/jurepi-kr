import { describe, it, expect } from 'vitest';
import { lineColFromParseError } from './tokenizer';

describe('tokenizer.ts', () => {
  describe('lineColFromParseError', () => {
    it('reports error at position 0 on single line', () => {
      const json = '{invalid}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
        expect(result.token).toBeDefined();
        expect(result.context).toBeDefined();
      }
    });

    it('reports trailing comma error', () => {
      const json = '{"name": "John", "age": 30, }';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
        expect(result.token).toBe('}');
      }
    });

    it('reports error on multiline JSON', () => {
      const json = '{\n  "name": "John",\n  "age": 30,\n}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(4);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('reports unclosed brace error', () => {
      const json = '{"name": "John"';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('reports single quote error', () => {
      const json = "{'name': 'John'}";
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
        // Token might be the quote or the string with quote
        expect(result.token.includes("'")).toBeTruthy();
      }
    });

    it('reports missing colon error', () => {
      const json = '{"name" "John"}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('reports unquoted key error', () => {
      const json = '{name: "John"}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('handles multiline with error deep in structure', () => {
      const json = '{\n  "data": {\n    "items": [\n      {"id": 1, "value": }\n    ]\n  }\n}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        // Error is on the line with the closing brace after empty value
        expect(result.line).toBeGreaterThanOrEqual(4);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('provides context around error', () => {
      const json = '{"name":"John","age":30,}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.context.length).toBeGreaterThan(0);
        expect(result.context.includes('30') || result.context.includes('}')).toBeTruthy();
      }
    });

    it('handles error at start of string', () => {
      const json = '{';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBe(1);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('handles various encoding issues gracefully', () => {
      const json = '{"text": "hello�"}';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        // Should not throw, should return valid result
        expect(result.line).toBeGreaterThan(0);
        expect(result.column).toBeGreaterThan(0);
      }
    });

    it('returns 1-indexed line and column', () => {
      const json = 'invalid';
      try {
        JSON.parse(json);
      } catch (err) {
        const result = lineColFromParseError(json, err as Error);
        expect(result.line).toBeGreaterThanOrEqual(1);
        expect(result.column).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
