import { describe, it, expect } from 'vitest';
import { parseNumberList } from './parse';
import { LOTTO_MIN, LOTTO_MAX } from './schema';

const parse = (raw: string) => parseNumberList(raw, LOTTO_MIN, LOTTO_MAX);

describe('parseNumberList', () => {
  it('parses a single number', () => {
    expect(parse('7')).toEqual([7]);
  });

  it('parses comma-separated numbers', () => {
    expect(parse('7,13,21')).toEqual([7, 13, 21]);
  });

  it('tolerates spaces around commas', () => {
    expect(parse(' 7 , 13 , 21 ')).toEqual([7, 13, 21]);
  });

  it('accepts any non-digit run as a separator (spaces, commas mixed)', () => {
    expect(parse('7 13, 21')).toEqual([7, 13, 21]);
  });

  it('ignores empty tokens from trailing/leading/duplicate separators', () => {
    expect(parse(',7,,13,')).toEqual([7, 13]);
  });

  it('drops numbers outside the valid range', () => {
    expect(parse('0, 7, 45, 46, 100')).toEqual([7, 45]);
  });

  it('removes duplicates, preserving first-seen order', () => {
    expect(parse('13, 7, 13, 7')).toEqual([13, 7]);
  });

  it('returns an empty array for empty or non-numeric input', () => {
    expect(parse('')).toEqual([]);
    expect(parse('   ')).toEqual([]);
    expect(parse('abc')).toEqual([]);
  });

  it('keeps the inclusive boundaries', () => {
    expect(parse('1, 45')).toEqual([1, 45]);
  });
});
