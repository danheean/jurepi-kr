/**
 * Core character counting functions.
 * All functions are pure, deterministic, and handle edge cases.
 */

import { countGraphemes } from './segmenter';
import type { CharacterCounterMetrics } from './types';

/**
 * Count graphemes (emoji/ZWJ = 1 character).
 * Uses Intl.Segmenter if available; fallback to String.length.
 * Empty string → 0.
 */
export function countCharacters(text: string): number {
  return countGraphemes(text);
}

/**
 * Count graphemes, excluding whitespace (space/tab/newline/etc).
 * Empty string → 0.
 */
export function countCharactersNoSpaces(text: string): number {
  if (!text) return 0;
  const withoutSpaces = text.replace(/\s/g, '');
  return countGraphemes(withoutSpaces);
}

/**
 * Count words (split on /\s+/, trim).
 * Empty string → 0.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/);
  return words.filter((w) => w.length > 0).length;
}

/**
 * Count sentences (split on /[.!?…]+/, trim).
 * Non-empty text with no sentence-ending punctuation = 1 sentence.
 * Empty string → 0.
 */
export function countSentences(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Check if text contains any sentence-ending punctuation
  const hasPunctuation = /[.!?…]/.test(trimmed);

  if (!hasPunctuation) {
    // Non-empty text with no punctuation = 1 sentence
    return 1;
  }

  // Split on sentence-ending punctuation
  const sentences = trimmed.split(/[.!?…]+/);
  // Filter out empty segments and trim each
  const nonEmpty = sentences.filter((s) => s.trim().length > 0);
  return nonEmpty.length;
}

/**
 * Count paragraphs (split on /\n\s*\n/).
 * Empty string → 0.
 */
export function countParagraphs(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;

  // Split on blank-line separator (one or more newlines with optional whitespace)
  const paragraphs = trimmed.split(/\n\s*\n/);
  // Filter out empty trimmed segments
  const nonEmpty = paragraphs.filter((p) => p.trim().length > 0);
  return nonEmpty.length;
}

/**
 * Count lines (split on /\r\n|\r|\n/).
 * Empty string → 0; otherwise segments.length.
 */
export function countLines(text: string): number {
  if (!text) return 0;
  // Split on any line-ending type
  const lines = text.split(/\r\n|\r|\n/);
  return lines.length;
}

/**
 * UTF-8 byte size via TextEncoder.
 */
export function getByteSize(text: string): number {
  if (!text) return 0;
  const encoder = new TextEncoder();
  return encoder.encode(text).length;
}

/**
 * Estimate reading time in minutes.
 * Rounds to 1 decimal place; 0 for empty.
 */
export function estimateReadingTime(
  words: number,
  readWPM: number = 200
): number {
  if (words === 0) return 0;
  if (readWPM <= 0) return 0;
  const minutes = words / readWPM;
  return Math.round(minutes * 10) / 10; // Round to 1 decimal place
}

/**
 * Estimate speaking time in minutes.
 * Rounds to 1 decimal place; 0 for empty.
 */
export function estimateSpeakingTime(
  words: number,
  speakWPM: number = 130
): number {
  if (words === 0) return 0;
  if (speakWPM <= 0) return 0;
  const minutes = words / speakWPM;
  return Math.round(minutes * 10) / 10; // Round to 1 decimal place
}

/**
 * Compute all metrics in one call (convenience wrapper).
 */
export function computeMetrics(
  text: string,
  options?: { readWPM?: number; speakWPM?: number }
): CharacterCounterMetrics {
  const readWPM = options?.readWPM ?? 200;
  const speakWPM = options?.speakWPM ?? 130;

  const charactersWithSpaces = countCharacters(text);
  const charactersWithoutSpaces = countCharactersNoSpaces(text);
  const words = countWords(text);
  const sentences = countSentences(text);
  const paragraphs = countParagraphs(text);
  const lines = countLines(text);
  const byteSize = getByteSize(text);
  const readingTimeMinutes = estimateReadingTime(words, readWPM);
  const speakingTimeMinutes = estimateSpeakingTime(words, speakWPM);

  return {
    charactersWithSpaces,
    charactersWithoutSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    byteSize,
    readingTimeMinutes,
    speakingTimeMinutes,
  };
}
