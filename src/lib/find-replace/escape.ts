/**
 * Escape a literal string for safe use as a RegExp pattern.
 * Escapes regex metacharacters: . ^ $ * + ? { } [ ] ( ) | \
 *
 * @param literal Plain text to escape
 * @return RegExp-safe escaped string
 *
 * INVARIANT: Pure, synchronous, always succeeds.
 * Example: "." → "\\.", "$1" → "\\$1"
 */
export function escapeRegExp(literal: string): string {
  return literal.replace(/[.^$*+?{}()\[\]|\\]/g, '\\$&');
}

/**
 * Escape a literal string for safe use as a replacement string in String.replace.
 * In String.replace, the replacement string can contain special sequences:
 * - $$ → single $
 * - $& → matched text
 * - $1, $2, ... → capture groups
 * - $<name> → named groups
 *
 * In literal mode, we want "$1" to be treated as literal "$1", not a backreference.
 * So we escape all $ as $$.
 *
 * @param literal Plain text to escape for replacement
 * @return String.replace-safe escaped string
 *
 * INVARIANT: Pure, synchronous, always succeeds.
 * Example: "$1" → "$$1" (becomes literal "$1" in replacement)
 */
export function escapeReplacement(literal: string): string {
  return literal.replace(/\$/g, '$$$$');
}
