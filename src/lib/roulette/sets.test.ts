import { describe, it, expect } from 'vitest';
import {
  addSet,
  deleteSet,
  renameSet,
  updateOptions,
  loadLastSet,
  serializeStore,
  deserializeStore,
  isDuplicateLabel,
} from './sets';
import type { Option, OptionSet, RouletteStore } from './schema';
import { STORE_VERSION } from './schema';

describe('sets.ts', () => {
  const freshStore = (): RouletteStore => ({
    version: STORE_VERSION,
    sets: {},
    lastSetName: null,
  });

  const sampleSet = (): OptionSet => ({
    name: 'Lunch',
    options: [
      { label: 'Pizza', weight: 1 },
      { label: 'Pasta', weight: 2 },
    ],
    createdAt: Date.now(),
  });

  describe('addSet', () => {
    it('adds a set to the store', () => {
      const store = freshStore();
      const set = sampleSet();

      const result = addSet(store, set);

      expect(result.sets['Lunch']).toEqual(set);
    });

    it('does not mutate the original store', () => {
      const store = freshStore();
      const set = sampleSet();
      const storeCopy = JSON.parse(JSON.stringify(store));

      addSet(store, set);

      expect(store).toEqual(storeCopy);
    });

    it('returns a new store object', () => {
      const store = freshStore();
      const set = sampleSet();

      const result = addSet(store, set);

      expect(result).not.toBe(store);
    });

    it('preserves existing sets when adding a new one', () => {
      const store = freshStore();
      const set1 = { ...sampleSet(), name: 'Set 1' };
      const set2 = { ...sampleSet(), name: 'Set 2' };

      const result1 = addSet(store, set1);
      const result2 = addSet(result1, set2);

      expect(result2.sets['Set 1']).toEqual(set1);
      expect(result2.sets['Set 2']).toEqual(set2);
    });

    it('overwrites existing set with same name', () => {
      const store = freshStore();
      const set1 = sampleSet();
      const set2 = { ...sampleSet(), options: [{ label: 'NewOption', weight: 1 }] };

      const result1 = addSet(store, set1);
      const result2 = addSet(result1, set2);

      expect(result2.sets['Lunch'].options).toEqual(set2.options);
    });
  });

  describe('deleteSet', () => {
    it('deletes a set from the store', () => {
      const store = freshStore();
      const set = sampleSet();

      const withSet = addSet(store, set);
      const result = deleteSet(withSet, 'Lunch');

      expect(result.sets['Lunch']).toBeUndefined();
    });

    it('does not mutate the original store', () => {
      const store = freshStore();
      const set = sampleSet();
      const withSet = addSet(store, set);
      const copy = JSON.parse(JSON.stringify(withSet));

      deleteSet(withSet, 'Lunch');

      expect(withSet).toEqual(copy);
    });

    it('clears lastSetName if deleted set is the last one', () => {
      const store = freshStore();
      const set = sampleSet();

      let result = addSet(store, set);
      result = { ...result, lastSetName: 'Lunch' };
      result = deleteSet(result, 'Lunch');

      expect(result.lastSetName).toBeNull();
    });

    it('preserves lastSetName if deleting a different set', () => {
      const store = freshStore();
      const set1 = { ...sampleSet(), name: 'Set 1' };
      const set2 = { ...sampleSet(), name: 'Set 2' };

      let result = addSet(store, set1);
      result = addSet(result, set2);
      result = { ...result, lastSetName: 'Set 1' };
      result = deleteSet(result, 'Set 2');

      expect(result.lastSetName).toBe('Set 1');
    });

    it('returns store unchanged if set does not exist', () => {
      const store = freshStore();
      const result = deleteSet(store, 'NonExistent');

      expect(result.sets).toEqual({});
      expect(result.lastSetName).toBeNull();
    });
  });

  describe('renameSet', () => {
    it('renames a set in the store', () => {
      const store = freshStore();
      const set = sampleSet();

      let result = addSet(store, set);
      result = renameSet(result, 'Lunch', 'Dinner');

      expect(result.sets['Dinner']).toEqual(set);
      expect(result.sets['Lunch']).toBeUndefined();
    });

    it('does not mutate the original store', () => {
      const store = freshStore();
      const set = sampleSet();
      let withSet = addSet(store, set);
      const copy = JSON.parse(JSON.stringify(withSet));

      renameSet(withSet, 'Lunch', 'Dinner');

      expect(withSet).toEqual(copy);
    });

    it('updates lastSetName if renaming the active set', () => {
      const store = freshStore();
      const set = sampleSet();

      let result = addSet(store, set);
      result = { ...result, lastSetName: 'Lunch' };
      result = renameSet(result, 'Lunch', 'Dinner');

      expect(result.lastSetName).toBe('Dinner');
    });

    it('preserves lastSetName if renaming a different set', () => {
      const store = freshStore();
      const set1 = { ...sampleSet(), name: 'Set 1' };
      const set2 = { ...sampleSet(), name: 'Set 2' };

      let result = addSet(store, set1);
      result = addSet(result, set2);
      result = { ...result, lastSetName: 'Set 1' };
      result = renameSet(result, 'Set 2', 'Set 2 Renamed');

      expect(result.lastSetName).toBe('Set 1');
    });

    it('returns store unchanged if old name does not exist', () => {
      const store = freshStore();
      const result = renameSet(store, 'NonExistent', 'NewName');

      expect(result.sets).toEqual({});
    });
  });

  describe('updateOptions', () => {
    it('updates options in a set', () => {
      const set = sampleSet();
      const newOptions: Option[] = [
        { label: 'Burger', weight: 1 },
        { label: 'Fries', weight: 1 },
      ];

      const result = updateOptions(set, newOptions);

      expect(result.options).toEqual(newOptions);
    });

    it('does not mutate the original set', () => {
      const set = sampleSet();
      const newOptions: Option[] = [
        { label: 'Burger', weight: 1 },
      ];
      const setCopy = JSON.parse(JSON.stringify(set));

      updateOptions(set, newOptions);

      expect(set).toEqual(setCopy);
    });

    it('returns a new OptionSet object', () => {
      const set = sampleSet();
      const newOptions: Option[] = [];

      const result = updateOptions(set, newOptions);

      expect(result).not.toBe(set);
    });

    it('preserves name and createdAt', () => {
      const set = sampleSet();
      const newOptions: Option[] = [{ label: 'New', weight: 1 }];

      const result = updateOptions(set, newOptions);

      expect(result.name).toBe(set.name);
      expect(result.createdAt).toBe(set.createdAt);
    });
  });

  describe('loadLastSet', () => {
    it('returns options if lastSetName is valid', () => {
      const store = freshStore();
      const set = sampleSet();

      let result = addSet(store, set);
      result = { ...result, lastSetName: 'Lunch' };

      const options = loadLastSet(result);

      expect(options).toEqual(set.options);
    });

    it('returns null if lastSetName is null', () => {
      const store = freshStore();
      const options = loadLastSet(store);

      expect(options).toBeNull();
    });

    it('returns null if lastSetName does not exist', () => {
      const store = freshStore();
      store.lastSetName = 'NonExistent';

      const options = loadLastSet(store);

      expect(options).toBeNull();
    });
  });

  describe('isDuplicateLabel', () => {
    it('returns true if label exists (case-insensitive)', () => {
      const options: Option[] = [
        { label: 'Pizza', weight: 1 },
        { label: 'Pasta', weight: 1 },
      ];

      expect(isDuplicateLabel(options, 'pizza')).toBe(true);
      expect(isDuplicateLabel(options, 'PIZZA')).toBe(true);
      expect(isDuplicateLabel(options, 'Pizza')).toBe(true);
    });

    it('returns false if label does not exist', () => {
      const options: Option[] = [
        { label: 'Pizza', weight: 1 },
      ];

      expect(isDuplicateLabel(options, 'Pasta')).toBe(false);
    });

    it('returns false for empty options array', () => {
      const options: Option[] = [];

      expect(isDuplicateLabel(options, 'Pizza')).toBe(false);
    });

    it('ignores whitespace differences', () => {
      const options: Option[] = [
        { label: 'Pizza', weight: 1 },
      ];

      expect(isDuplicateLabel(options, 'pizza')).toBe(true);
      expect(isDuplicateLabel(options, 'PIZZA')).toBe(true);
    });
  });

  describe('serializeStore', () => {
    it('converts store to JSON string', () => {
      const store = freshStore();
      const json = serializeStore(store);

      expect(typeof json).toBe('string');
      expect(JSON.parse(json)).toEqual(store);
    });

    it('preserves all store data', () => {
      const store = freshStore();
      const set = sampleSet();
      let withSet = addSet(store, set);
      withSet = { ...withSet, lastSetName: 'Lunch' };

      const json = serializeStore(withSet);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe(STORE_VERSION);
      expect(parsed.sets['Lunch']).toEqual(set);
      expect(parsed.lastSetName).toBe('Lunch');
    });
  });

  describe('deserializeStore', () => {
    it('parses JSON string to store', () => {
      const store = freshStore();
      const json = serializeStore(store);

      const result = deserializeStore(json);

      expect(result.version).toBe(STORE_VERSION);
      expect(result.sets).toEqual({});
      expect(result.lastSetName).toBeNull();
    });

    it('throws on invalid JSON', () => {
      expect(() => deserializeStore('invalid json')).toThrow();
    });

    it('throws on invalid schema', () => {
      const badStore = JSON.stringify({
        version: 2, // invalid version
        sets: {},
        lastSetName: null,
      });

      expect(() => deserializeStore(badStore)).toThrow();
    });

    it('preserves complex data structures', () => {
      const store = freshStore();
      const set1 = { ...sampleSet(), name: 'Set 1' };
      const set2 = { ...sampleSet(), name: 'Set 2', options: [{ label: 'Option', weight: 100 }] };

      let result = addSet(store, set1);
      result = addSet(result, set2);
      result = { ...result, lastSetName: 'Set 2' };

      const json = serializeStore(result);
      const parsed = deserializeStore(json);

      expect(parsed.sets['Set 1']).toEqual(set1);
      expect(parsed.sets['Set 2']).toEqual(set2);
      expect(parsed.lastSetName).toBe('Set 2');
    });
  });
});
