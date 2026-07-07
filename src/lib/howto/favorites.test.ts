import { describe, it, expect } from 'vitest';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from './favorites';
import { MergedGuide } from './schema';

const createDummyGuide = (slug: string): MergedGuide => ({
  slug,
  topic: 'setup',
  tags: [],
  order: 1,
  related: [],
  ko: { title: slug, summary: slug, body: 'body' },
  en: { title: slug, summary: slug, body: 'body' }
});

describe('toggleFavorite', () => {
  it('adds slug to empty list', () => {
    const result = toggleFavorite([], 'guide1');
    expect(result).toEqual(['guide1']);
  });

  it('removes slug if already present', () => {
    const result = toggleFavorite(['guide1', 'guide2'], 'guide1');
    expect(result).toEqual(['guide2']);
  });

  it('adds slug to end of list', () => {
    const result = toggleFavorite(['guide1', 'guide2'], 'guide3');
    expect(result).toEqual(['guide1', 'guide2', 'guide3']);
  });

  it('removes middle slug', () => {
    const result = toggleFavorite(['guide1', 'guide2', 'guide3'], 'guide2');
    expect(result).toEqual(['guide1', 'guide3']);
  });

  it('is immutable (does not mutate input)', () => {
    const original = ['guide1'];
    const result = toggleFavorite(original, 'guide2');
    expect(original).toEqual(['guide1']);
    expect(result).toEqual(['guide1', 'guide2']);
  });
});

describe('pushRecent', () => {
  it('adds slug to empty list', () => {
    const result = pushRecent([], 'guide1');
    expect(result).toEqual(['guide1']);
  });

  it('moves slug to front if already present', () => {
    const result = pushRecent(['guide1', 'guide2', 'guide3'], 'guide2');
    expect(result).toEqual(['guide2', 'guide1', 'guide3']);
  });

  it('adds slug to front of list', () => {
    const result = pushRecent(['guide1', 'guide2'], 'guide3');
    expect(result).toEqual(['guide3', 'guide1', 'guide2']);
  });

  it('limits to max items (default 20)', () => {
    let list: string[] = [];
    for (let i = 0; i < 25; i++) {
      list = pushRecent(list, `guide${i}`);
    }
    expect(list).toHaveLength(RECENTS_MAX);
    expect(list[0]).toBe('guide24'); // most recent
    expect(list[RECENTS_MAX - 1]).toBe('guide5'); // oldest kept
  });

  it('respects custom max parameter', () => {
    let list: string[] = [];
    for (let i = 0; i < 10; i++) {
      list = pushRecent(list, `guide${i}`, 3);
    }
    expect(list).toHaveLength(3);
    expect(list).toEqual(['guide9', 'guide8', 'guide7']);
  });

  it('de-duplicates when moving to front', () => {
    const result = pushRecent(
      ['guide1', 'guide2', 'guide1', 'guide3'],
      'guide1'
    );
    expect(result).toEqual(['guide1', 'guide2', 'guide3']);
  });

  it('is immutable (does not mutate input)', () => {
    const original = ['guide1'];
    const result = pushRecent(original, 'guide2');
    expect(original).toEqual(['guide1']);
    expect(result).toEqual(['guide2', 'guide1']);
  });
});

describe('pruneUnknown', () => {
  it('keeps all slugs when they exist in catalog', () => {
    const catalog = [
      createDummyGuide('guide1'),
      createDummyGuide('guide2'),
      createDummyGuide('guide3')
    ];
    const result = pruneUnknown(['guide1', 'guide2', 'guide3'], catalog);
    expect(result).toEqual(['guide1', 'guide2', 'guide3']);
  });

  it('removes unknown slugs', () => {
    const catalog = [
      createDummyGuide('guide1'),
      createDummyGuide('guide2')
    ];
    const result = pruneUnknown(['guide1', 'guide2', 'guide3', 'guide4'], catalog);
    expect(result).toEqual(['guide1', 'guide2']);
  });

  it('handles empty list', () => {
    const catalog = [createDummyGuide('guide1')];
    const result = pruneUnknown([], catalog);
    expect(result).toEqual([]);
  });

  it('handles empty catalog', () => {
    const result = pruneUnknown(['guide1', 'guide2'], []);
    expect(result).toEqual([]);
  });

  it('maintains order', () => {
    const catalog = [
      createDummyGuide('guide1'),
      createDummyGuide('guide2'),
      createDummyGuide('guide3')
    ];
    const result = pruneUnknown(['guide3', 'guide1', 'guide2'], catalog);
    expect(result).toEqual(['guide3', 'guide1', 'guide2']);
  });

  it('is immutable (does not mutate input)', () => {
    const catalog = [createDummyGuide('guide1')];
    const original = ['guide1', 'guide2'];
    const result = pruneUnknown(original, catalog);
    expect(original).toEqual(['guide1', 'guide2']);
    expect(result).toEqual(['guide1']);
  });
});
