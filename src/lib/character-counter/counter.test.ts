/**
 * Character Counter Domain Tests (TDD)
 * Comprehensive coverage of counting functions with edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  countCharacters,
  countCharactersNoSpaces,
  countWords,
  countSentences,
  countParagraphs,
  countLines,
  getByteSize,
  estimateReadingTime,
  estimateSpeakingTime,
  computeMetrics,
} from './counter';

describe('Character Counter Domain', () => {
  describe('countCharacters (grapheme aware)', () => {
    it('should count ASCII characters', () => {
      expect(countCharacters('Hello')).toBe(5);
    });

    it('should count Korean characters', () => {
      expect(countCharacters('안녕하세요')).toBe(5);
    });

    it('should count emoji as 1 grapheme', () => {
      expect(countCharacters('👋')).toBe(1);
    });

    it('should count emoji with spaces correctly', () => {
      expect(countCharacters('Hello 👋 world')).toBe(13);
    });

    it('should count ZWJ (family emoji) as 1 grapheme', () => {
      // Family emoji: 👨‍👩‍👧‍👦 (man, ZWJ, woman, ZWJ, girl, ZWJ, boy)
      expect(countCharacters('👨‍👩‍👧‍👦')).toBe(1);
    });

    it('should return 0 for empty string', () => {
      expect(countCharacters('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(countCharacters('   ')).toBe(3); // Spaces are counted as characters
    });

    it('should count mixed content', () => {
      expect(countCharacters('안녕 👋 Hello')).toBe(10);
    });

    it('should count emoji with skin tone modifier', () => {
      // 👋🏻 = wave + light skin tone
      expect(countCharacters('👋🏻')).toBe(1);
    });
  });

  describe('countCharactersNoSpaces', () => {
    it('should count characters without spaces', () => {
      expect(countCharactersNoSpaces('Hello world')).toBe(10);
    });

    it('should count emoji without spaces', () => {
      expect(countCharactersNoSpaces('Hello 👋 world')).toBe(11);
    });

    it('should handle tabs and newlines', () => {
      expect(countCharactersNoSpaces('Hello\tworld\n!')).toBe(11);
    });

    it('should return 0 for empty string', () => {
      expect(countCharactersNoSpaces('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(countCharactersNoSpaces('   ')).toBe(0);
    });

    it('should count Korean without spaces', () => {
      expect(countCharactersNoSpaces('안녕 하세요')).toBe(5);
    });
  });

  describe('countWords', () => {
    it('should count simple words', () => {
      expect(countWords('Hello world')).toBe(2);
    });

    it('should count words with multiple spaces', () => {
      expect(countWords('Hello    world')).toBe(2);
    });

    it('should count words with tabs', () => {
      expect(countWords('Hello\tworld')).toBe(2);
    });

    it('should count words with newlines', () => {
      expect(countWords('Hello\nworld')).toBe(2);
    });

    it('should count Korean words', () => {
      expect(countWords('안녕 하세요')).toBe(2);
    });

    it('should return 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(countWords('   ')).toBe(0);
    });

    it('should count words with emoji', () => {
      expect(countWords('Hello 👋 world')).toBe(3);
    });

    it('should handle leading/trailing whitespace', () => {
      expect(countWords('  Hello world  ')).toBe(2);
    });

    it('should count a single word', () => {
      expect(countWords('Hello')).toBe(1);
    });
  });

  describe('countSentences', () => {
    it('should count sentences ending with period', () => {
      expect(countSentences('Hello. World.')).toBe(2);
    });

    it('should count sentences ending with exclamation', () => {
      expect(countSentences('Hello! World!')).toBe(2);
    });

    it('should count sentences ending with question mark', () => {
      expect(countSentences('Hello? World?')).toBe(2);
    });

    it('should count sentences with ellipsis', () => {
      expect(countSentences('Hello… World…')).toBe(2);
    });

    it('should count text with no punctuation as 1 sentence', () => {
      expect(countSentences('안녕하세요')).toBe(1);
    });

    it('should count text with no punctuation as 1 sentence (English)', () => {
      expect(countSentences('Hello world')).toBe(1);
    });

    it('should return 0 for empty string', () => {
      expect(countSentences('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(countSentences('   ')).toBe(0);
    });

    it('should handle multiple punctuation marks', () => {
      expect(countSentences('Hello!!! World??')).toBe(2);
    });

    it('should handle mixed punctuation', () => {
      expect(countSentences('Hello. World! How are you?')).toBe(3);
    });

    it('should not count trailing punctuation as empty sentence', () => {
      expect(countSentences('Hello world.')).toBe(1);
    });

    it('should handle sentence with emoji', () => {
      expect(countSentences('Hello 👋.')).toBe(1);
    });
  });

  describe('countParagraphs', () => {
    it('should count single paragraph', () => {
      expect(countParagraphs('Hello world')).toBe(1);
    });

    it('should count multiple paragraphs separated by blank line', () => {
      expect(countParagraphs('Hello world\n\nSecond paragraph')).toBe(2);
    });

    it('should count paragraphs with multiple newlines', () => {
      expect(countParagraphs('Para 1\n\n\nPara 2')).toBe(2);
    });

    it('should count paragraphs with spaces between newlines', () => {
      expect(countParagraphs('Para 1\n \n Para 2')).toBe(2);
    });

    it('should return 0 for empty string', () => {
      expect(countParagraphs('')).toBe(0);
    });

    it('should return 0 for whitespace-only string', () => {
      expect(countParagraphs('   \n\n   ')).toBe(0);
    });

    it('should handle leading/trailing blank lines', () => {
      expect(countParagraphs('\n\nHello\n\n')).toBe(1);
    });

    it('should count three paragraphs', () => {
      expect(
        countParagraphs('Para 1\n\nPara 2\n\nPara 3')
      ).toBe(3);
    });

    it('should handle paragraphs with multiple lines', () => {
      expect(
        countParagraphs('Line 1\nLine 2\n\nPara 2')
      ).toBe(2);
    });
  });

  describe('countLines', () => {
    it('should count single line', () => {
      expect(countLines('Hello')).toBe(1);
    });

    it('should count lines separated by LF', () => {
      expect(countLines('Hello\nWorld')).toBe(2);
    });

    it('should count lines separated by CRLF', () => {
      expect(countLines('Hello\r\nWorld')).toBe(2);
    });

    it('should count lines separated by CR', () => {
      expect(countLines('Hello\rWorld')).toBe(2);
    });

    it('should handle mixed line endings', () => {
      expect(countLines('Line1\r\nLine2\nLine3\rLine4')).toBe(4);
    });

    it('should return 0 for empty string', () => {
      expect(countLines('')).toBe(0);
    });

    it('should return 1 for whitespace-only line', () => {
      expect(countLines('   ')).toBe(1);
    });

    it('should count trailing newline as creating a new line', () => {
      expect(countLines('Hello\n')).toBe(2);
    });

    it('should count trailing CRLF', () => {
      expect(countLines('Hello\r\n')).toBe(2);
    });

    it('should count three lines', () => {
      expect(countLines('Line1\nLine2\nLine3')).toBe(3);
    });
  });

  describe('getByteSize', () => {
    it('should count ASCII bytes', () => {
      expect(getByteSize('Hello')).toBe(5);
    });

    it('should count Korean characters as 3 bytes', () => {
      expect(getByteSize('한')).toBe(3);
    });

    it('should count Korean string', () => {
      expect(getByteSize('안녕')).toBe(6); // 2 chars × 3 bytes
    });

    it('should count emoji as 4 bytes', () => {
      expect(getByteSize('👋')).toBe(4);
    });

    it('should count mixed content', () => {
      const result = getByteSize('Hello 안녕 👋');
      // 'Hello ' = 6 bytes
      // '안녕 ' = 6 + 1 = 7 bytes
      // '👋' = 4 bytes
      // Total: 6 + 7 + 4 = 17 bytes
      expect(result).toBe(17);
    });

    it('should return 0 for empty string', () => {
      expect(getByteSize('')).toBe(0);
    });

    it('should handle special characters', () => {
      expect(getByteSize('!')).toBe(1);
      expect(getByteSize('…')).toBe(3); // Ellipsis is 3 bytes in UTF-8
    });
  });

  describe('estimateReadingTime', () => {
    it('should return 0 for 0 words', () => {
      expect(estimateReadingTime(0)).toBe(0);
    });

    it('should calculate reading time with default WPM', () => {
      expect(estimateReadingTime(200)).toBe(1);
    });

    it('should calculate reading time with custom WPM', () => {
      expect(estimateReadingTime(130, 130)).toBe(1);
    });

    it('should round to 1 decimal place', () => {
      expect(estimateReadingTime(250, 200)).toBe(1.3);
    });

    it('should handle fractional results', () => {
      expect(estimateReadingTime(100, 200)).toBe(0.5);
    });

    it('should handle small values', () => {
      expect(estimateReadingTime(10, 200)).toBe(0.1);
    });

    it('should handle zero WPM (edge case)', () => {
      expect(estimateReadingTime(100, 0)).toBe(0);
    });

    it('should handle negative WPM (edge case)', () => {
      expect(estimateReadingTime(100, -200)).toBe(0);
    });
  });

  describe('estimateSpeakingTime', () => {
    it('should return 0 for 0 words', () => {
      expect(estimateSpeakingTime(0)).toBe(0);
    });

    it('should calculate speaking time with default WPM', () => {
      expect(estimateSpeakingTime(130)).toBe(1);
    });

    it('should calculate speaking time with custom WPM', () => {
      expect(estimateSpeakingTime(200, 200)).toBe(1);
    });

    it('should round to 1 decimal place', () => {
      expect(estimateSpeakingTime(325, 130)).toBe(2.5);
    });

    it('should handle fractional results', () => {
      expect(estimateSpeakingTime(65, 130)).toBe(0.5);
    });

    it('should handle zero WPM (edge case)', () => {
      expect(estimateSpeakingTime(100, 0)).toBe(0);
    });
  });

  describe('computeMetrics', () => {
    it('should compute metrics for empty string', () => {
      const metrics = computeMetrics('');
      expect(metrics.charactersWithSpaces).toBe(0);
      expect(metrics.charactersWithoutSpaces).toBe(0);
      expect(metrics.words).toBe(0);
      expect(metrics.sentences).toBe(0);
      expect(metrics.paragraphs).toBe(0);
      expect(metrics.lines).toBe(0);
      expect(metrics.byteSize).toBe(0);
      expect(metrics.readingTimeMinutes).toBe(0);
      expect(metrics.speakingTimeMinutes).toBe(0);
    });

    it('should compute metrics for simple text', () => {
      const metrics = computeMetrics('Hello world');
      expect(metrics.charactersWithSpaces).toBe(11);
      expect(metrics.charactersWithoutSpaces).toBe(10);
      expect(metrics.words).toBe(2);
      expect(metrics.sentences).toBe(1); // No punctuation = 1
      expect(metrics.paragraphs).toBe(1);
      expect(metrics.lines).toBe(1);
      expect(metrics.byteSize).toBe(11);
      expect(metrics.readingTimeMinutes).toBe(0);
      expect(metrics.speakingTimeMinutes).toBe(0);
    });

    it('should compute metrics with custom WPM', () => {
      const metrics = computeMetrics('Hello world test string', {
        readWPM: 100,
        speakWPM: 100,
      });
      expect(metrics.words).toBe(4);
      expect(metrics.readingTimeMinutes).toBe(0);
      expect(metrics.speakingTimeMinutes).toBe(0);
    });

    it('should compute metrics for Korean text', () => {
      const metrics = computeMetrics('안녕하세요');
      expect(metrics.charactersWithSpaces).toBe(5);
      expect(metrics.charactersWithoutSpaces).toBe(5);
      expect(metrics.words).toBe(1);
      expect(metrics.sentences).toBe(1);
      expect(metrics.paragraphs).toBe(1);
      expect(metrics.lines).toBe(1);
      expect(metrics.byteSize).toBe(15); // 5 × 3 bytes
    });

    it('should compute metrics for emoji text', () => {
      const metrics = computeMetrics('Hello 👋 world');
      expect(metrics.charactersWithSpaces).toBe(13);
      expect(metrics.charactersWithoutSpaces).toBe(11);
      expect(metrics.words).toBe(3);
      expect(metrics.sentences).toBe(1);
      expect(metrics.paragraphs).toBe(1);
      expect(metrics.lines).toBe(1);
      // 'Hello ' = 6, '👋 ' = 5, 'world' = 5 = 16 bytes
      expect(metrics.byteSize).toBe(16);
    });

    it('should compute metrics with punctuation', () => {
      const metrics = computeMetrics('Hello. World! How are you?');
      expect(metrics.sentences).toBe(3);
    });

    it('should compute metrics with multiple paragraphs', () => {
      const metrics = computeMetrics('Para 1\n\nPara 2\n\nPara 3');
      expect(metrics.paragraphs).toBe(3);
    });

    it('should compute metrics with CRLF', () => {
      const metrics = computeMetrics('Line1\r\nLine2\r\nLine3');
      expect(metrics.lines).toBe(3);
    });
  });
});
