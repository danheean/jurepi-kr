/**
 * Grapheme-aware character counting using Intl.Segmenter.
 * Falls back to String.length if unavailable (with console.warn).
 */

let segmenterWarned = false;

/**
 * Count grapheme segments using Intl.Segmenter.
 * Emoji and ZWJ sequences count as 1.
 * Falls back to String.length with a one-time console.warn if unavailable.
 * Empty string → 0.
 */
export function countGraphemes(text: string): number {
  if (!text) return 0;

  // Check if Intl.Segmenter is available
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, {
        granularity: 'grapheme',
      });
      const segments = Array.from(
        segmenter.segment(text),
        (seg: any) => seg.segment
      );
      return segments.length;
    } catch {
      // Fallback if Segmenter fails
      if (!segmenterWarned) {
        console.warn(
          '[character-counter] Intl.Segmenter failed; falling back to String.length'
        );
        segmenterWarned = true;
      }
      return text.length;
    }
  }

  // Fallback: Intl.Segmenter not available
  if (!segmenterWarned) {
    console.warn(
      '[character-counter] Intl.Segmenter not available; falling back to String.length'
    );
    segmenterWarned = true;
  }
  return text.length;
}
