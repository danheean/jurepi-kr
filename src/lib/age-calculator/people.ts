import { nanoid } from 'nanoid';
import { Person, PeopleStore } from './schema';
import { DateKey } from './date';
import type { CalendarType } from './resolve';

const MAX_PEOPLE = 20;

/**
 * Add a new person to the store.
 * Immutable: returns new store with person appended.
 * Enforces max 20 people (caps if adding would exceed).
 */
export function addPerson(
  store: PeopleStore,
  name: string,
  birthdate: DateKey,
  calendarType: CalendarType = 'solar',
  isLeapMonth = false
): PeopleStore {
  if (store.people.length >= MAX_PEOPLE) {
    return store;
  }

  const newPerson: Person = {
    id: nanoid(),
    name,
    birthdate,
    calendarType,
    isLeapMonth,
  };

  return {
    ...store,
    people: [...store.people, newPerson],
    meta: {
      ...store.meta,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Remove a person from the store by id.
 * Immutable: returns new store without the person.
 */
export function removePerson(store: PeopleStore, personId: string): PeopleStore {
  return {
    ...store,
    people: store.people.filter((p) => p.id !== personId),
    meta: {
      ...store.meta,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Update a person's fields (name, birthdate).
 * Immutable: returns new store with updated person.
 */
export function updatePerson(
  store: PeopleStore,
  personId: string,
  updates: Partial<Omit<Person, 'id'>>
): PeopleStore {
  return {
    ...store,
    people: store.people.map((p) =>
      p.id === personId ? { ...p, ...updates } : p
    ),
    meta: {
      ...store.meta,
      updatedAt: Date.now(),
    },
  };
}

/**
 * Prune unknown ids from store.
 * Keeps only people whose ids are in knownIds (or all if knownIds is undefined).
 * Immutable: returns new store.
 */
export function pruneUnknown(store: PeopleStore, knownIds?: string[]): PeopleStore {
  if (!knownIds) {
    return store;
  }

  const knownSet = new Set(knownIds);

  return {
    ...store,
    people: store.people.filter((p) => knownSet.has(p.id)),
    meta: {
      ...store.meta,
      updatedAt: Date.now(),
    },
  };
}
