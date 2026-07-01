/**
 * Extract plain text from markdown for JSON-LD descriptions, search indexing.
 * Pure function, no React/DOM dependencies.
 */

/**
 * Strip markdown syntax and return plain text.
 * - Removes code blocks (```...```)
 * - Converts links [text](url) → text
 * - Removes bold (**text**)
 * - Removes italic (*text*)
 * - Removes inline code (`code`)
 * - Removes headings (# text)
 * - Removes list markers (-, *, 1., etc.)
 * - Removes blockquote markers (>)
 * - Removes image syntax ![alt](url)
 * - Collapses whitespace to single spaces
 */
export function markdownToPlainText(mdBody: string): string {
  let result = mdBody;

  // Remove code blocks (```...```)
  result = result.replace(/```[\s\S]*?```/g, '');

  // Remove image syntax ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // Convert links [text](url) → text
  result = result.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Remove bold **text** → text
  result = result.replace(/\*\*([^\*]+)\*\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');

  // Remove italic *text* → text (but not **bold**)
  result = result.replace(/\*([^\*]+)\*/g, '$1');
  result = result.replace(/_([^_]+)_/g, '$1');

  // Remove inline code `code`
  result = result.replace(/`([^`]+)`/g, '$1');

  // Remove headings (# text, ## text, ### text, etc.)
  result = result.replace(/^#+\s+/gm, '');

  // Remove list markers (-, *, +) followed by space
  result = result.replace(/^[\s\-\*\+]+\s+/gm, '');

  // Remove numbered list markers (1., 2., etc.)
  result = result.replace(/^\s*\d+\.\s+/gm, '');

  // Remove blockquote markers (>)
  result = result.replace(/^>\s*/gm, '');

  // Collapse multiple spaces to single space
  result = result.replace(/\s+/g, ' ');

  // Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

/**
 * Truncate plain text to max chars, break at word boundary, add "…"
 */
export function truncateToLength(text: string, maxChars: number = 160): string {
  if (text.length <= maxChars) {
    return text;
  }

  // Find the last space before maxChars to break at word boundary
  let truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0 && lastSpace > maxChars * 0.7) {
    // Only break at word if it's reasonably close to max
    truncated = truncated.substring(0, lastSpace);
  }

  return truncated + '…';
}
