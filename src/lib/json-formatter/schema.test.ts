import { describe, it, expect } from 'vitest';
import {
  formatOptionsSchema,
  storageSchema,
  parseStorage,
  serializeStorage,
} from './schema';

describe('schema.ts', () => {
  describe('formatOptionsSchema', () => {
    it('accepts valid indent options', () => {
      expect(formatOptionsSchema.parse({ indent: '2', sortKeys: false })).toEqual({
        indent: '2',
        sortKeys: false,
      });

      expect(formatOptionsSchema.parse({ indent: '4', sortKeys: true })).toEqual({
        indent: '4',
        sortKeys: true,
      });

      expect(formatOptionsSchema.parse({ indent: 'tab', sortKeys: false })).toEqual({
        indent: 'tab',
        sortKeys: false,
      });
    });

    it('uses default indent if not provided', () => {
      expect(formatOptionsSchema.parse({ sortKeys: false })).toEqual({
        indent: '2',
        sortKeys: false,
      });
    });

    it('uses default sortKeys if not provided', () => {
      expect(formatOptionsSchema.parse({ indent: '4' })).toEqual({
        indent: '4',
        sortKeys: false,
      });
    });

    it('rejects invalid indent', () => {
      expect(() => formatOptionsSchema.parse({ indent: '3', sortKeys: false })).toThrow();
    });

    it('rejects non-boolean sortKeys', () => {
      expect(() => formatOptionsSchema.parse({ indent: '2', sortKeys: 'true' })).toThrow();
    });
  });

  describe('storageSchema', () => {
    it('parses valid storage state', () => {
      const state = {
        version: 1,
        indent: '2' as const,
        sortKeys: false,
      };
      expect(storageSchema.parse(state)).toEqual(state);
    });

    it('accepts optional lastInput', () => {
      const state = {
        version: 1,
        indent: '4' as const,
        sortKeys: true,
        lastInput: '{"test": "data"}',
      };
      expect(storageSchema.parse(state)).toEqual(state);
    });

    it('uses defaults for missing fields', () => {
      const result = storageSchema.parse({});
      expect(result.version).toBe(1);
      expect(result.indent).toBe('2');
      expect(result.sortKeys).toBe(false);
      expect(result.lastInput).toBeUndefined();
    });
  });

  describe('parseStorage', () => {
    it('parses valid JSON storage', () => {
      const json = JSON.stringify({
        version: 1,
        indent: '4',
        sortKeys: true,
        lastInput: '{"a": 1}',
      });
      const result = parseStorage(json);
      expect(result.version).toBe(1);
      expect(result.indent).toBe('4');
      expect(result.sortKeys).toBe(true);
      expect(result.lastInput).toBe('{"a": 1}');
    });

    it('handles malformed JSON gracefully', () => {
      const result = parseStorage('{invalid json}');
      expect(result.version).toBe(1);
      expect(result.indent).toBe('2');
      expect(result.sortKeys).toBe(false);
    });

    it('handles invalid schema gracefully', () => {
      const json = JSON.stringify({
        version: 1,
        indent: 'invalid',
        sortKeys: false,
      });
      const result = parseStorage(json);
      expect(result.version).toBe(1);
      expect(result.indent).toBe('2');
      expect(result.sortKeys).toBe(false);
    });

    it('handles empty string gracefully', () => {
      const result = parseStorage('');
      expect(result.version).toBe(1);
      expect(result.indent).toBe('2');
      expect(result.sortKeys).toBe(false);
    });

    it('handles null gracefully', () => {
      const result = parseStorage('null');
      expect(result.version).toBe(1);
      expect(result.indent).toBe('2');
      expect(result.sortKeys).toBe(false);
    });
  });

  describe('serializeStorage', () => {
    it('serializes storage state to JSON', () => {
      const state = {
        version: 1,
        indent: '4' as const,
        sortKeys: true,
      };
      const json = serializeStorage(state);
      expect(JSON.parse(json)).toEqual(state);
    });

    it('preserves lastInput when provided', () => {
      const state = {
        version: 1,
        indent: '2' as const,
        sortKeys: false,
        lastInput: '{"test": "data"}',
      };
      const json = serializeStorage(state);
      expect(JSON.parse(json)).toEqual(state);
    });

    it('round-trips through parseStorage', () => {
      const original = {
        version: 1,
        indent: '4' as const,
        sortKeys: true,
        lastInput: '{"complex": ["data", 123]}',
      };
      const json = serializeStorage(original);
      const parsed = parseStorage(json);
      expect(parsed).toEqual(original);
    });
  });
});
