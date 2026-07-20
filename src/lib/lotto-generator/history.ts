import { HistoryEntrySchema, HISTORY_MAX, type HistoryEntry } from './schema';
import { isDrawFeasible } from './validate';

/**
 * Add a new entry to history (immutable).
 *
 * @param history - Existing history array
 * @param entry - New entry to prepend
 * @returns New array with entry at index 0, max 20 total
 */
export function addHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const updated = [entry, ...history];
  if (updated.length > HISTORY_MAX) {
    return updated.slice(0, HISTORY_MAX);
  }
  return updated;
}

/**
 * Prune invalid entries after localStorage load.
 * Removes entries with infeasible or corrupt settings.
 *
 * @param history - Loaded from localStorage
 * @returns New array with only valid entries
 */
export function pruneUnknown(history: HistoryEntry[]): HistoryEntry[] {
  return history.filter((entry) => {
    try {
      // Validate against schema
      HistoryEntrySchema.parse(entry);

      // Validate feasibility
      if (!isDrawFeasible(entry.fixedNumbers.length, entry.excludedNumbers.length)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Clear all history (immutable).
 *
 * @param history - Existing history
 * @returns Empty array
 */
export function clearHistory(_history: HistoryEntry[]): HistoryEntry[] {
  return [];
}
