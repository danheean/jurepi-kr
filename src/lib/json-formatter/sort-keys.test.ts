import { describe, it, expect } from 'vitest';
import { sortKeysRecursive } from './sort-keys';

describe('sort-keys.ts', () => {
  describe('sortKeysRecursive', () => {
    it('sorts object keys alphabetically', () => {
      const obj = { z: 1, a: 2, m: 3 };
      const result = sortKeysRecursive(obj);
      const keys = Object.keys(result);
      expect(keys).toEqual(['a', 'm', 'z']);
    });

    it('does not mutate original object', () => {
      const obj = { z: 1, a: 2 };
      const original = { ...obj };
      sortKeysRecursive(obj);
      expect(obj).toEqual(original);
    });

    it('sorts nested object keys', () => {
      const obj = { z: 1, a: { m: 2, b: 3 } };
      const result = sortKeysRecursive(obj);
      const outerKeys = Object.keys(result);
      const innerKeys = Object.keys(result.a);
      expect(outerKeys).toEqual(['a', 'z']);
      expect(innerKeys).toEqual(['b', 'm']);
    });

    it('preserves array order', () => {
      const obj = { arr: [3, 2, 1], z: 1, a: 2 };
      const result = sortKeysRecursive(obj);
      expect(result.arr).toEqual([3, 2, 1]);
    });

    it('recursively sorts arrays of objects', () => {
      const obj = [
        { z: 1, a: 2 },
        { m: 3, b: 4 },
      ];
      const result = sortKeysRecursive(obj);
      expect(Object.keys(result[0])).toEqual(['a', 'z']);
      expect(Object.keys(result[1])).toEqual(['b', 'm']);
    });

    it('handles deeply nested structures', () => {
      const obj = {
        z: {
          y: {
            x: { a: 1, z: 2 },
          },
        },
        a: 1,
      };
      const result = sortKeysRecursive(obj);
      expect(Object.keys(result)).toEqual(['a', 'z']);
      expect(Object.keys(result.z)).toEqual(['y']);
      expect(Object.keys(result.z.y)).toEqual(['x']);
      expect(Object.keys(result.z.y.x)).toEqual(['a', 'z']);
    });

    it('handles null values', () => {
      const obj = { z: null, a: 1 };
      const result = sortKeysRecursive(obj);
      expect(result).toEqual({ a: 1, z: null });
    });

    it('handles primitive values', () => {
      expect(sortKeysRecursive(123)).toBe(123);
      expect(sortKeysRecursive('string')).toBe('string');
      expect(sortKeysRecursive(true)).toBe(true);
      expect(sortKeysRecursive(null)).toBe(null);
    });

    it('handles undefined values', () => {
      const obj = { z: undefined, a: 1 };
      const result = sortKeysRecursive(obj);
      // Note: JSON.stringify removes undefined, so we just check the key order
      expect(Object.keys(result)).toEqual(['a', 'z']);
    });

    it('handles empty objects', () => {
      const result = sortKeysRecursive({});
      expect(result).toEqual({});
    });

    it('handles empty arrays', () => {
      const result = sortKeysRecursive([]);
      expect(result).toEqual([]);
    });

    it('preserves numeric values', () => {
      const obj = { z: 42.5, a: -10, m: 0 };
      const result = sortKeysRecursive(obj);
      expect(Object.keys(result)).toEqual(['a', 'm', 'z']);
      expect(result.z).toBe(42.5);
      expect(result.a).toBe(-10);
      expect(result.m).toBe(0);
    });
  });
});
