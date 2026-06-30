import { describe, it, expect } from 'vitest';
import {
  serialize,
  deserialize,
  mergeStores,
  analyzeConflicts,
  type Store,
  type ConflictSummary,
} from './serialization';
import { newStore } from './journal';

describe('serialization — JSON durability and merging', () => {
  describe('serialize', () => {
    it('converts a store to JSON string', () => {
      const store = newStore(1000);
      const json = serialize(store);
      expect(typeof json).toBe('string');
      expect(json).toContain('"version"');
      expect(json).toContain('"entries"');
    });

    it('produces deterministic output (sorted keys)', () => {
      const store = newStore(1000);
      const json1 = serialize(store);
      const json2 = serialize(store);
      expect(json1).toBe(json2);
    });
  });

  describe('deserialize', () => {
    it('parses JSON back to a store', () => {
      const original = newStore(1000);
      const json = serialize(original);
      const restored = deserialize(json);

      expect(restored.version).toBe(original.version);
      expect(restored.meta.createdAt).toBe(original.meta.createdAt);
      expect(restored.entries).toEqual(original.entries);
    });

    it('throws on malformed JSON', () => {
      expect(() => deserialize('not json')).toThrow();
    });

    it('throws on invalid schema (missing required fields)', () => {
      const invalid = JSON.stringify({ version: 1 }); // Missing entries, meta
      expect(() => deserialize(invalid)).toThrow();
    });

    it('throws on invalid dateKey format', () => {
      const invalid = JSON.stringify({
        version: 1,
        entries: {
          'invalid-key': {
            date: 'invalid',
            questionKey: '06-30',
            text: 'answer',
            createdAt: 1000,
            updatedAt: 1000,
          },
        },
        meta: { createdAt: 1000 },
      });
      expect(() => deserialize(invalid)).toThrow();
    });

    it('runs migration on deserialized store', () => {
      const store = newStore(1000);
      const json = serialize(store);
      const restored = deserialize(json);
      expect(restored.version).toBe(1);
    });
  });

  describe('round-trip byte-fidelity', () => {
    it('preserve text, dateKey, timestamps through serialize/deserialize', () => {
      let store = newStore(1000);

      // Manually add an entry (normally via journal.upsertEntry)
      store = {
        ...store,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'My answer with special chars: 한글 😀',
            createdAt: 1234567890,
            updatedAt: 1234567900,
          },
        },
      };

      const json = serialize(store);
      const restored = deserialize(json);

      const entry = restored.entries['2026-06-30'];
      expect(entry.text).toBe('My answer with special chars: 한글 😀');
      expect(entry.createdAt).toBe(1234567890);
      expect(entry.updatedAt).toBe(1234567900);
      expect(entry.date).toBe('2026-06-30');
    });
  });

  describe('mergeStores', () => {
    it('combines entries from local and imported stores', () => {
      const local: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'local answer',
            createdAt: 1000,
            updatedAt: 1000,
          },
        },
        meta: { createdAt: 1000 },
      };

      const imported: Store = {
        version: 1,
        entries: {
          '2026-06-29': {
            date: '2026-06-29',
            questionKey: '06-29',
            text: 'imported answer',
            createdAt: 2000,
            updatedAt: 2000,
          },
        },
        meta: { createdAt: 2000 },
      };

      const merged = mergeStores(local, imported);
      expect(Object.keys(merged.entries)).toHaveLength(2);
      expect(merged.entries['2026-06-30'].text).toBe('local answer');
      expect(merged.entries['2026-06-29'].text).toBe('imported answer');
    });

    it('resolves conflicts by newer updatedAt', () => {
      const local: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'local answer',
            createdAt: 1000,
            updatedAt: 1500, // Newer
          },
        },
        meta: { createdAt: 1000 },
      };

      const imported: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'imported answer',
            createdAt: 1000,
            updatedAt: 1200, // Older
          },
        },
        meta: { createdAt: 1000 },
      };

      const merged = mergeStores(local, imported);
      expect(merged.entries['2026-06-30'].text).toBe('local answer');
      expect(merged.entries['2026-06-30'].updatedAt).toBe(1500);
    });

    it('prefers imported entry when it is newer', () => {
      const local: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'local answer',
            createdAt: 1000,
            updatedAt: 1200, // Older
          },
        },
        meta: { createdAt: 1000 },
      };

      const imported: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'imported answer',
            createdAt: 1000,
            updatedAt: 1500, // Newer
          },
        },
        meta: { createdAt: 1000 },
      };

      const merged = mergeStores(local, imported);
      expect(merged.entries['2026-06-30'].text).toBe('imported answer');
      expect(merged.entries['2026-06-30'].updatedAt).toBe(1500);
    });

    it('returns a new Store (immutable)', () => {
      const local = newStore(1000);
      const imported = newStore(2000);
      const merged = mergeStores(local, imported);
      expect(merged).not.toBe(local);
      expect(merged).not.toBe(imported);
    });
  });

  describe('analyzeConflicts', () => {
    it('reports total imported and conflict count', () => {
      const local: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'local',
            createdAt: 1000,
            updatedAt: 1000,
          },
        },
        meta: { createdAt: 1000 },
      };

      const imported: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'imported',
            createdAt: 1000,
            updatedAt: 2000,
          },
          '2026-06-29': {
            date: '2026-06-29',
            questionKey: '06-29',
            text: 'new',
            createdAt: 2000,
            updatedAt: 2000,
          },
        },
        meta: { createdAt: 2000 },
      };

      const summary = analyzeConflicts(local, imported);
      expect(summary.totalImported).toBe(2);
      expect(summary.conflicts).toBe(1); // Only 06-30 conflicts
    });

    it('counts only same-dateKey, different-updatedAt as conflicts', () => {
      const local: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'local',
            createdAt: 1000,
            updatedAt: 1000,
          },
        },
        meta: { createdAt: 1000 },
      };

      const imported: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'imported',
            createdAt: 1000,
            updatedAt: 1000, // Same updatedAt → same entry, not a conflict
          },
        },
        meta: { createdAt: 1000 },
      };

      const summary = analyzeConflicts(local, imported);
      expect(summary.conflicts).toBe(0);
    });

    it('returns 0 conflicts if no overlap', () => {
      const local: Store = {
        version: 1,
        entries: {
          '2026-06-30': {
            date: '2026-06-30',
            questionKey: '06-30',
            text: 'local',
            createdAt: 1000,
            updatedAt: 1000,
          },
        },
        meta: { createdAt: 1000 },
      };

      const imported: Store = {
        version: 1,
        entries: {
          '2026-06-29': {
            date: '2026-06-29',
            questionKey: '06-29',
            text: 'new',
            createdAt: 2000,
            updatedAt: 2000,
          },
        },
        meta: { createdAt: 2000 },
      };

      const summary = analyzeConflicts(local, imported);
      expect(summary.conflicts).toBe(0);
    });
  });
});
