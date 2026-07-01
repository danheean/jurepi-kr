/**
 * Add a recent input to the front of the list.
 * De-duplicate (remove if already present), then prepend.
 * Truncate to max.
 */
export function pushRecent(list: string[], text: string, max: number = 10): string[] {
  const cleaned = list.filter((item) => item !== text);
  return [text, ...cleaned].slice(0, max);
}

/**
 * Prune unknown/invalid entries (e.g., after validation fails).
 * Fail-gracefully: if list is empty or undefined, return [].
 */
export function pruneUnknown(list: unknown[]): string[] {
  if (!Array.isArray(list)) {
    return [];
  }

  return list.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

/**
 * Serialize recents to JSON.
 */
export function serializeRecents(recents: string[]): string {
  return JSON.stringify(recents);
}

/**
 * Deserialize recents from JSON.
 * Fail-gracefully: invalid JSON or invalid entries → start fresh.
 */
export function deserializeRecents(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return pruneUnknown(parsed);
  } catch {
    return [];
  }
}
