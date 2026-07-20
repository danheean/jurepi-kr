import { normalizeMessage, isValidMessage } from './sanitize';
import { MAX_RECENTS } from './schema';

export { MAX_RECENTS } from './schema';

/**
 * Add a message to the recents list (MRU order, dedup, cap MAX_RECENTS).
 * Returns a new array (immutable).
 * @param recents - current recents list
 * @param message - new message to add
 * @returns new recents array with message prepended, deduplicated, and capped
 */
export function addRecent(recents: string[], message: string): string[] {
  const trimmed = normalizeMessage(message);
  if (!isValidMessage(trimmed)) {
    return recents;
  }
  // Remove existing occurrence if present
  const deduplicated = recents.filter((r) => r !== trimmed);
  // Prepend new message, cap at MAX_RECENTS
  return [trimmed, ...deduplicated].slice(0, MAX_RECENTS);
}

/**
 * Prune recents from localStorage (remove non-strings, empties, cap MAX_RECENTS).
 * @param recents - unknown value from localStorage
 * @returns cleaned recents array
 */
export function pruneRecents(recents: unknown): string[] {
  if (!Array.isArray(recents)) {
    return [];
  }
  return recents
    .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    .slice(0, MAX_RECENTS);
}
