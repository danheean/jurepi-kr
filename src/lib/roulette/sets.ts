import { RouletteStoreSchema, type Option, type OptionSet, type RouletteStore } from './schema';

/**
 * CRITICAL: All operations return new objects, never mutate in-place.
 */

/**
 * Add or overwrite a set in the store.
 */
export function addSet(store: RouletteStore, set: OptionSet): RouletteStore {
  return {
    ...store,
    sets: { ...store.sets, [set.name]: set },
  };
}

/**
 * Delete a set from the store.
 * If the deleted set is the last active one, clear lastSetName.
 */
export function deleteSet(store: RouletteStore, name: string): RouletteStore {
  const { [name]: _, ...rest } = store.sets;
  return {
    ...store,
    sets: rest,
    lastSetName: store.lastSetName === name ? null : store.lastSetName,
  };
}

/**
 * Rename a set in the store.
 * Updates lastSetName if the renamed set is the active one.
 */
export function renameSet(
  store: RouletteStore,
  oldName: string,
  newName: string
): RouletteStore {
  const set = store.sets[oldName];
  if (!set) {
    return store;
  }
  const { [oldName]: _, ...rest } = store.sets;
  return {
    ...store,
    sets: { ...rest, [newName]: set },
    lastSetName: store.lastSetName === oldName ? newName : store.lastSetName,
  };
}

/**
 * Update options in a set.
 * Returns a new OptionSet with updated options.
 */
export function updateOptions(set: OptionSet, newOptions: Option[]): OptionSet {
  return { ...set, options: newOptions };
}

/**
 * Load the last active set's options from the store.
 * Returns null if no set is active or the set does not exist.
 */
export function loadLastSet(store: RouletteStore): Option[] | null {
  const name = store.lastSetName;
  return name && store.sets[name] ? store.sets[name].options : null;
}

/**
 * Check if a label already exists in the options (case-insensitive).
 */
export function isDuplicateLabel(options: Option[], label: string): boolean {
  const lowerLabel = label.toLowerCase();
  return options.some((opt) => opt.label.toLowerCase() === lowerLabel);
}

/**
 * Serialize a store to JSON string for localStorage.
 */
export function serializeStore(store: RouletteStore): string {
  return JSON.stringify(store);
}

/**
 * Deserialize a JSON string to a store, with zod validation.
 * Throws if the JSON is invalid or the schema validation fails.
 */
export function deserializeStore(json: string): RouletteStore {
  const parsed = JSON.parse(json);
  return RouletteStoreSchema.parse(parsed);
}
