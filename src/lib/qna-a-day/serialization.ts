import { migrate, StoreSchema, type Store, type Entry } from './schema';
import { z } from 'zod';

export type { Store, Entry };

/**
 * Serialize a Store to a JSON string.
 * Produces deterministic output by stringifying directly.
 */
export function serialize(store: Readonly<Store>): string {
  return JSON.stringify(store);
}

/**
 * Deserialize JSON to a validated Store.
 * Throws ZodError if validation fails.
 */
export function deserialize(json: string): Store {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  return migrate(raw);
}

/**
 * Merge two stores.
 * Conflicts (same dateKey, different updatedAt) are resolved by keeping the newer entry.
 * Returns a new Store (immutable).
 */
export function mergeStores(local: Store, imported: Store): Store {
  const merged: Store = {
    version: local.version,
    entries: { ...local.entries },
    meta: { ...local.meta },
  };

  for (const [dateKey, importedEntry] of Object.entries(imported.entries)) {
    const localEntry = local.entries[dateKey];

    if (!localEntry) {
      // New entry from import
      merged.entries[dateKey] = importedEntry;
    } else if (importedEntry.updatedAt > localEntry.updatedAt) {
      // Imported is newer
      merged.entries[dateKey] = importedEntry;
    }
    // Else: local is newer or equal, keep local
  }

  return merged;
}

export interface ConflictSummary {
  totalImported: number;
  conflicts: number;
}

/**
 * Analyze conflicts between local and imported stores before merging.
 */
export function analyzeConflicts(local: Store, imported: Store): ConflictSummary {
  const totalImported = Object.keys(imported.entries).length;
  let conflicts = 0;

  for (const [dateKey, importedEntry] of Object.entries(imported.entries)) {
    const localEntry = local.entries[dateKey];
    if (localEntry && importedEntry.updatedAt !== localEntry.updatedAt) {
      conflicts++;
    }
  }

  return { totalImported, conflicts };
}
