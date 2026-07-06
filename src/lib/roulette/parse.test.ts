import { describe, it, expect } from 'vitest';
import { splitOptionLabels } from './parse';

describe('parse.ts', () => {
  describe('splitOptionLabels', () => {
    it('returns a single trimmed label when no separators', () => {
      expect(splitOptionLabels('  자장면  ')).toEqual(['자장면']);
    });

    it('splits comma-separated labels', () => {
      expect(splitOptionLabels('자장면, 짬뽕, 치킨')).toEqual(['자장면', '짬뽕', '치킨']);
    });

    it('splits newline-separated labels (pasted list)', () => {
      expect(splitOptionLabels('자장면\n짬뽕\n치킨')).toEqual(['자장면', '짬뽕', '치킨']);
    });

    it('handles CRLF and mixed separators', () => {
      expect(splitOptionLabels('A\r\nB, C\nD')).toEqual(['A', 'B', 'C', 'D']);
    });

    it('drops empty segments (consecutive separators, trailing comma)', () => {
      expect(splitOptionLabels('A,,B, ,C,')).toEqual(['A', 'B', 'C']);
    });

    it('returns [] for empty or whitespace/separator-only input', () => {
      expect(splitOptionLabels('')).toEqual([]);
      expect(splitOptionLabels('   ')).toEqual([]);
      expect(splitOptionLabels(', ,\n,')).toEqual([]);
    });

    it('dedupes case-insensitively keeping the first occurrence', () => {
      expect(splitOptionLabels('Pizza, pizza, PIZZA, Pasta')).toEqual(['Pizza', 'Pasta']);
    });

    it('truncates each label to 50 chars (input maxLength과 동일 계약)', () => {
      const long = 'a'.repeat(60);
      expect(splitOptionLabels(long)).toEqual(['a'.repeat(50)]);
    });

    it('keeps inner spaces in labels', () => {
      expect(splitOptionLabels('점심 추천, 저녁 추천')).toEqual(['점심 추천', '저녁 추천']);
    });
  });
});
