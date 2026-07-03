import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown } from './favorites';

describe('toggleFavorite', () => {
  it('adds slug if not present', () => {
    const list = ['grace-hopper'];
    const result = toggleFavorite(list, 'guido-van-rossum');

    expect(result).toEqual(['grace-hopper', 'guido-van-rossum']);
    expect(list).toEqual(['grace-hopper']); // Original unchanged
  });

  it('removes slug if present', () => {
    const list = ['grace-hopper', 'guido-van-rossum'];
    const result = toggleFavorite(list, 'grace-hopper');

    expect(result).toEqual(['guido-van-rossum']);
  });

  it('returns new array (immutable)', () => {
    const list = ['grace-hopper'];
    const result = toggleFavorite(list, 'guido-van-rossum');

    expect(result).not.toBe(list);
  });

  it('handles empty list', () => {
    const list: string[] = [];
    const result = toggleFavorite(list, 'grace-hopper');

    expect(result).toEqual(['grace-hopper']);
  });
});

describe('pushRecent', () => {
  it('adds new slug to front', () => {
    const list = ['grace-hopper'];
    const result = pushRecent(list, 'guido-van-rossum');

    expect(result).toEqual(['guido-van-rossum', 'grace-hopper']);
  });

  it('moves existing slug to front (de-duplicate)', () => {
    const list = ['guido-van-rossum', 'grace-hopper'];
    const result = pushRecent(list, 'grace-hopper');

    expect(result).toEqual(['grace-hopper', 'guido-van-rossum']);
  });

  it('enforces max length (default 20)', () => {
    const list = Array.from({ length: 20 }, (_, i) => `person-${i}`);
    const result = pushRecent(list, 'new-person');

    expect(result).toHaveLength(20);
    expect(result[0]).toBe('new-person');
    expect(result).not.toContain('person-19'); // Last one removed
  });

  it('enforces custom max length', () => {
    const list = ['person-1', 'person-2', 'person-3'];
    const result = pushRecent(list, 'new-person', 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toBe('new-person');
    expect(result).not.toContain('person-3');
  });

  it('handles empty list', () => {
    const list: string[] = [];
    const result = pushRecent(list, 'grace-hopper');

    expect(result).toEqual(['grace-hopper']);
  });

  it('returns new array (immutable)', () => {
    const list = ['grace-hopper'];
    const result = pushRecent(list, 'guido-van-rossum');

    expect(result).not.toBe(list);
  });

  it('MRU order', () => {
    let list: string[] = [];
    list = pushRecent(list, 'alice');
    list = pushRecent(list, 'bob');
    list = pushRecent(list, 'charlie');

    expect(list).toEqual(['charlie', 'bob', 'alice']);
  });
});

describe('pruneUnknown', () => {
  it('keeps only valid slugs', () => {
    const list = ['grace-hopper', 'unknown', 'guido-van-rossum'];
    const validSlugs = ['grace-hopper', 'guido-van-rossum', 'linus-torvalds'];

    const result = pruneUnknown(list, validSlugs);

    expect(result).toEqual(['grace-hopper', 'guido-van-rossum']);
  });

  it('returns empty if all unknown', () => {
    const list = ['unknown1', 'unknown2'];
    const validSlugs = ['grace-hopper', 'guido-van-rossum'];

    const result = pruneUnknown(list, validSlugs);

    expect(result).toEqual([]);
  });

  it('preserves order', () => {
    const list = ['c', 'b', 'a', 'd'];
    const validSlugs = ['a', 'b', 'c'];

    const result = pruneUnknown(list, validSlugs);

    expect(result).toEqual(['c', 'b', 'a']);
  });

  it('handles empty list', () => {
    const list: string[] = [];
    const validSlugs = ['grace-hopper'];

    const result = pruneUnknown(list, validSlugs);

    expect(result).toEqual([]);
  });

  it('returns new array (immutable)', () => {
    const list = ['grace-hopper'];
    const validSlugs = ['grace-hopper'];

    const result = pruneUnknown(list, validSlugs);

    expect(result).not.toBe(list);
  });
});
