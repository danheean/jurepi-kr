import type { FindReplaceStore, SavedRuleSet, Rule } from './schema';
import { RECENTS_MAX, SAVED_SETS_MAX, parseStore } from './schema';

/**
 * Add a recent text to the front of the list (MRU order).
 * Removes duplicates (moves existing to front).
 * Truncates to RECENTS_MAX.
 * Immutable: returns a new array.
 *
 * @param list Current recents list
 * @param text Text to add
 * @param max Optional max length (default RECENTS_MAX)
 * @return New recents list
 */
export function pushRecent(
  list: string[],
  text: string,
  max: number = RECENTS_MAX
): string[] {
  // Remove existing occurrence (deduplicate)
  const filtered = list.filter((t) => t !== text);
  // Add to front
  const result = [text, ...filtered];
  // Truncate to max
  return result.slice(0, max);
}

/**
 * Save a rule-set under a name.
 * Immutable: returns a new array.
 * If a set with the same name exists, replaces it.
 * Deep-copies rules to prevent external mutations.
 *
 * @param sets Current saved rule-sets
 * @param name Name for the rule-set
 * @param rules Rules to save
 * @return New sets array
 */
export function saveSet(
  sets: SavedRuleSet[],
  name: string,
  rules: Rule[]
): SavedRuleSet[] {
  // Remove existing set with same name (replace mode)
  const filtered = sets.filter((s) => s.name !== name);
  // Deep-copy rules to prevent external mutations
  const copiedRules = rules.map((rule) => ({ ...rule }));
  // Add new set
  const result = [...filtered, { name, rules: copiedRules }];
  // Enforce max
  return result.slice(-SAVED_SETS_MAX);
}

/**
 * Remove a saved rule-set by name.
 * Immutable: returns a new array.
 *
 * @param sets Current saved rule-sets
 * @param name Name of set to remove
 * @return New sets array
 */
export function removeSet(sets: SavedRuleSet[], name: string): SavedRuleSet[] {
  return sets.filter((s) => s.name !== name);
}

/**
 * Prune invalid entries from a store.
 * Re-validates the store schema and removes entries that don't conform.
 * Immutable: returns a new store.
 *
 * @param store Store to prune
 * @return New pruned store
 */
export function pruneInvalid(store: FindReplaceStore): FindReplaceStore {
  // Re-parse to ensure validity (this filters out invalid entries)
  const json = JSON.stringify(store);
  return parseStore(json);
}

/**
 * Serialize a store to JSON string for storage.
 *
 * @param store Store to serialize
 * @return JSON string
 */
export function serializeStore(store: FindReplaceStore): string {
  return JSON.stringify(store);
}

/**
 * Deserialize a store from JSON string.
 * Fails gracefully: returns empty store on error.
 *
 * @param json JSON string
 * @return Parsed store
 */
export function deserializeStore(json: string): FindReplaceStore {
  return parseStore(json);
}
