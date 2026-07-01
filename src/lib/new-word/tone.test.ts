import { describe, it, expect } from 'vitest';
import { TONES, TONE_EMOJI, isTone, toneEmoji } from './tone';

describe('tone', () => {
  it('maps each sentiment tone to a distinct emoji', () => {
    const emojis = TONES.map((t) => TONE_EMOJI[t]);
    expect(new Set(emojis).size).toBe(TONES.length);
    expect(TONE_EMOJI.positive).toBe('😊');
    expect(TONE_EMOJI.negative).toBe('😠');
    expect(TONE_EMOJI.neutral).toBe('😐');
  });

  it('isTone narrows only known tones', () => {
    expect(isTone('positive')).toBe(true);
    expect(isTone('negative')).toBe(true);
    expect(isTone('neutral')).toBe(true);
    expect(isTone('happy')).toBe(false);
    expect(isTone(undefined)).toBe(false);
    expect(isTone(null)).toBe(false);
    expect(isTone(3)).toBe(false);
  });

  it('toneEmoji returns the emoji for a valid tone', () => {
    expect(toneEmoji('positive')).toBe('😊');
    expect(toneEmoji('negative')).toBe('😠');
    expect(toneEmoji('neutral')).toBe('😐');
  });

  it('toneEmoji returns null for absent/unknown tone (no emoji rendered)', () => {
    expect(toneEmoji(undefined)).toBeNull();
    expect(toneEmoji(null)).toBeNull();
    expect(toneEmoji('')).toBeNull();
    expect(toneEmoji('mixed')).toBeNull();
  });
});
