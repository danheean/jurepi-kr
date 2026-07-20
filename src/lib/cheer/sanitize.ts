import { MIN_LEN, MAX_LEN } from './schema';

export { MIN_LEN, MAX_LEN } from './schema';

/**
 * Normalize user message: trim, collapse whitespace (no length cap).
 * Length validation happens in isValidMessage.
 * @param text - raw user input
 * @returns normalized message (trimmed, collapsed whitespace)
 */
export function normalizeMessage(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Check if a message is valid (after normalization).
 * @param text - user message to validate
 * @returns true if valid (MIN_LEN..MAX_LEN after normalization)
 */
export function isValidMessage(text: string): boolean {
  const normalized = normalizeMessage(text);
  return normalized.length >= MIN_LEN && normalized.length <= MAX_LEN;
}
