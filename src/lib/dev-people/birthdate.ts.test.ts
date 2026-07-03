import { describe, it, expect } from 'vitest';
import { calculateAge, type Age } from './birthdate';

describe('calculateAge', () => {
  it('returns undefined if birthYear absent', () => {
    const result = calculateAge(undefined, undefined);
    expect(result).toBeUndefined();
  });

  it('returns age if alive (deathYear absent)', () => {
    const currentYear = 2024;
    const result = calculateAge(1956, undefined, currentYear);

    expect(result).toEqual({ type: 'age', value: 68 });
  });

  it('returns ageAtDeath if dead (deathYear present)', () => {
    const result = calculateAge(1906, 1992);

    expect(result).toEqual({ type: 'ageAtDeath', value: 86 });
  });

  it('uses current year as default', () => {
    const currentYear = new Date().getFullYear();
    const birthYear = 1990;
    const result = calculateAge(birthYear, undefined);

    expect(result?.type).toBe('age');
    expect(result?.value).toBe(currentYear - birthYear);
  });

  it('handles edge case: birth year = current year (age 0)', () => {
    const currentYear = 2024;
    const result = calculateAge(2024, undefined, currentYear);

    expect(result).toEqual({ type: 'age', value: 0 });
  });

  it('handles historical figures correctly', () => {
    // Grace Hopper (1906–1992)
    const result = calculateAge(1906, 1992);
    expect(result).toEqual({ type: 'ageAtDeath', value: 86 });
  });

  it('handles contemporary figures (living)', () => {
    const currentYear = 2024;
    // Guido van Rossum (born 1956, still living as of 2024)
    const result = calculateAge(1956, undefined, currentYear);
    expect(result).toEqual({ type: 'age', value: 68 });
  });
});
