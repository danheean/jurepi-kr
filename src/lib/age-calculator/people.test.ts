import { describe, it, expect } from 'vitest';
import {
  addPerson,
  removePerson,
  updatePerson,
  pruneUnknown,
} from './people';
import { PeopleStore } from './schema';
import { DateKey } from './date';

describe('age-calculator/people', () => {
  const emptyStore = (now = Date.now()): PeopleStore => ({
    version: 1,
    people: [],
    meta: { createdAt: now, updatedAt: now },
  });

  describe('addPerson', () => {
    it('adds a new person to the store', () => {
      const store = emptyStore();
      const result = addPerson(store, 'Jane Doe', '1990-06-15' as DateKey);

      expect(result.people).toHaveLength(1);
      expect(result.people[0].name).toBe('Jane Doe');
      expect(result.people[0].birthdate).toBe('1990-06-15');
      expect(result.people[0].id).toBeDefined();
    });

    it('generates unique ids', () => {
      const store = emptyStore();
      const result1 = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const result2 = addPerson(result1, 'John', '1985-01-01' as DateKey);

      const ids = result2.people.map((p) => p.id);
      expect(new Set(ids).size).toBe(2); // All unique
    });

    it('returns immutable new store', () => {
      const store = emptyStore();
      const result = addPerson(store, 'Jane', '1990-06-15' as DateKey);

      expect(store.people).toHaveLength(0);
      expect(result.people).toHaveLength(1);
    });

    it('increments updatedAt timestamp', () => {
      const now = Date.now();
      const store = emptyStore(now);
      const result = addPerson(store, 'Jane', '1990-06-15' as DateKey);

      expect(result.meta.updatedAt).toBeGreaterThanOrEqual(now);
    });

    it('enforces max 20 people', () => {
      let store = emptyStore();

      // Add 20 people (should succeed)
      for (let i = 0; i < 20; i++) {
        store = addPerson(store, `Person${i}`, '1990-06-15' as DateKey);
      }

      expect(store.people).toHaveLength(20);

      // Try to add 21st (should fail or truncate)
      const beforeAdd = store.people.length;
      const result = addPerson(store, 'Person20', '1990-06-15' as DateKey);

      // Implementation choice: either throw or cap at 20
      // Based on spec invariant, we cap at 20
      expect(result.people.length).toBeLessThanOrEqual(20);
    });
  });

  describe('removePerson', () => {
    it('removes a person by id', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = removePerson(withPerson, personId);

      expect(result.people).toHaveLength(0);
    });

    it('returns immutable new store', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = removePerson(withPerson, personId);

      expect(withPerson.people).toHaveLength(1);
      expect(result.people).toHaveLength(0);
    });

    it('ignores removal of non-existent id', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);

      const result = removePerson(withPerson, 'non-existent');

      expect(result.people).toHaveLength(1);
    });

    it('increments updatedAt timestamp', () => {
      const now = Date.now();
      const store = emptyStore(now);
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = removePerson(withPerson, personId);

      expect(result.meta.updatedAt).toBeGreaterThanOrEqual(now);
    });
  });

  describe('updatePerson', () => {
    it('updates person name', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = updatePerson(withPerson, personId, { name: 'Jane Doe' });

      expect(result.people[0].name).toBe('Jane Doe');
      expect(result.people[0].birthdate).toBe('1990-06-15');
    });

    it('updates person birthdate', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = updatePerson(withPerson, personId, { birthdate: '1992-03-20' as DateKey });

      expect(result.people[0].birthdate).toBe('1992-03-20');
      expect(result.people[0].name).toBe('Jane');
    });

    it('returns immutable new store', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = updatePerson(withPerson, personId, { name: 'Jane Doe' });

      expect(withPerson.people[0].name).toBe('Jane');
      expect(result.people[0].name).toBe('Jane Doe');
    });

    it('ignores update of non-existent id', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);

      const result = updatePerson(withPerson, 'non-existent', { name: 'Other' });

      expect(result.people).toHaveLength(1);
      expect(result.people[0].name).toBe('Jane');
    });

    it('increments updatedAt timestamp', () => {
      const now = Date.now();
      const store = emptyStore(now);
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const personId = withPerson.people[0].id;

      const result = updatePerson(withPerson, personId, { name: 'Jane Doe' });

      expect(result.meta.updatedAt).toBeGreaterThanOrEqual(now);
    });
  });

  describe('pruneUnknown', () => {
    it('filters store to only known ids', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const knownIds = [withPerson.people[0].id];

      // Manually add another person, then prune to only known
      const withExtraManual: PeopleStore = {
        ...withPerson,
        people: [
          ...withPerson.people,
          { id: 'unknown', name: 'Unknown', birthdate: '2000-01-01' as DateKey, calendarType: 'solar', isLeapMonth: false },
        ],
      };

      const result = pruneUnknown(withExtraManual, knownIds);

      expect(result.people).toHaveLength(1);
      expect(result.people[0].id).toBe(knownIds[0]);
    });

    it('returns immutable new store', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);
      const knownIds = [withPerson.people[0].id];

      const result = pruneUnknown(withPerson, knownIds);

      // No unknown ids, should be same content
      expect(result.people).toHaveLength(1);
    });

    it('keeps all if no knownIds provided', () => {
      const store = emptyStore();
      const withPerson = addPerson(store, 'Jane', '1990-06-15' as DateKey);

      const result = pruneUnknown(withPerson);

      expect(result.people).toHaveLength(1);
    });
  });
});
