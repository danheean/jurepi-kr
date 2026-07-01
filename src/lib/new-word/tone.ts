/**
 * Sentiment tone of a term (긍정/부정/중립) → emoji.
 * Pure domain helper — no React/DOM. Reused by card + detail views.
 */
export type Tone = 'positive' | 'negative' | 'neutral';

export const TONES: readonly Tone[] = ['positive', 'negative', 'neutral'] as const;

/** Emoji shown for each sentiment tone. */
export const TONE_EMOJI: Record<Tone, string> = {
  positive: '😊',
  negative: '😠',
  neutral: '😐',
};

/** True when the value is a known Tone. */
export function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && (TONES as readonly string[]).includes(value);
}

/** Emoji for a tone, or null when tone is absent/unknown (no emoji rendered). */
export function toneEmoji(tone: string | undefined | null): string | null {
  return isTone(tone) ? TONE_EMOJI[tone] : null;
}
