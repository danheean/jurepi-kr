import { describe, it, expect } from 'vitest';
import { getStats } from './stats';

describe('stats.ts', () => {
  describe('getStats', () => {
    it('calculates byte size for simple object', () => {
      const json = { name: 'John', age: 30 };
      const stats = getStats(json);
      expect(stats.byteSize).toBeGreaterThan(0);
    });

    it('counts leaf elements correctly for object', () => {
      const json = { name: 'John', age: 30 };
      const stats = getStats(json);
      expect(stats.elementCount).toBe(2); // 2 leaf values
    });

    it('counts leaf elements correctly for nested object', () => {
      const json = { user: { name: 'John', age: 30 } };
      const stats = getStats(json);
      expect(stats.elementCount).toBe(2); // 2 leaf values
    });

    it('counts leaf elements correctly for array', () => {
      const json = [1, 2, 3];
      const stats = getStats(json);
      expect(stats.elementCount).toBe(3); // 3 leaf values
    });

    it('counts leaf elements correctly for array of objects', () => {
      const json = [{ id: 1 }, { id: 2 }];
      const stats = getStats(json);
      expect(stats.elementCount).toBe(2); // 2 leaf values
    });

    it('counts null as an element', () => {
      const json = { value: null };
      const stats = getStats(json);
      expect(stats.elementCount).toBe(1);
    });

    it('counts booleans as elements', () => {
      const json = { a: true, b: false };
      const stats = getStats(json);
      expect(stats.elementCount).toBe(2);
    });

    it('counts mixed types as elements', () => {
      const json = { str: 'hello', num: 42, bool: true, nul: null };
      const stats = getStats(json);
      expect(stats.elementCount).toBe(4);
    });

    it('calculates depth for simple object', () => {
      const json = { name: 'John' };
      const stats = getStats(json);
      expect(stats.depth).toBe(1);
    });

    it('calculates depth for nested objects', () => {
      const json = { a: { b: { c: 1 } } };
      const stats = getStats(json);
      expect(stats.depth).toBe(3);
    });

    it('calculates depth for arrays', () => {
      const json = [1, [2, [3, 4]]];
      const stats = getStats(json);
      expect(stats.depth).toBe(3);
    });

    it('calculates depth for mixed structure', () => {
      const json = { arr: [1, { deep: [2] }] };
      const stats = getStats(json);
      expect(stats.depth).toBeGreaterThanOrEqual(3);
    });

    it('handles empty objects', () => {
      const json = {};
      const stats = getStats(json);
      expect(stats.elementCount).toBe(0);
      expect(stats.depth).toBe(1);
    });

    it('handles empty arrays', () => {
      const json: any[] = [];
      const stats = getStats(json);
      expect(stats.elementCount).toBe(0);
      expect(stats.depth).toBe(1);
    });

    it('handles null at root', () => {
      const json = null;
      const stats = getStats(json);
      expect(stats.elementCount).toBe(1);
      expect(stats.depth).toBe(0);
    });

    it('handles primitives at root', () => {
      expect(getStats(42).elementCount).toBe(1);
      expect(getStats('string').elementCount).toBe(1);
      expect(getStats(true).elementCount).toBe(1);
    });

    it('byte size increases with content', () => {
      const small = getStats({ a: 1 });
      const large = getStats({ a: 'a'.repeat(100) });
      expect(large.byteSize).toBeGreaterThan(small.byteSize);
    });

    it('complex structure example', () => {
      const json = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        count: 2,
      };
      const stats = getStats(json);
      expect(stats.elementCount).toBeGreaterThan(0);
      expect(stats.depth).toBeGreaterThan(2);
      expect(stats.byteSize).toBeGreaterThan(0);
    });
  });
});
