import { describe, it, expect } from 'vitest';
import { formatGamesPlaintext } from './format';

describe('src/lib/lotto-generator/format', () => {
  const label = (i: number) => `Game ${i + 1}`;

  it('formats a single game as "label: n, n, ..."', () => {
    expect(formatGamesPlaintext([[2, 7, 18, 34, 41, 44]], label)).toBe(
      'Game 1: 2, 7, 18, 34, 41, 44',
    );
  });

  it('joins multiple games with newlines, no trailing newline', () => {
    const out = formatGamesPlaintext(
      [
        [2, 7, 18, 34, 41, 44],
        [5, 11, 23, 30, 38, 45],
      ],
      label,
    );
    expect(out).toBe('Game 1: 2, 7, 18, 34, 41, 44\nGame 2: 5, 11, 23, 30, 38, 45');
    expect(out.endsWith('\n')).toBe(false);
  });

  it('uses the injected label (locale-agnostic domain)', () => {
    expect(formatGamesPlaintext([[1, 2, 3, 4, 5, 6]], (i) => `게임 ${i + 1}`)).toBe(
      '게임 1: 1, 2, 3, 4, 5, 6',
    );
  });

  it('returns empty string for no games', () => {
    expect(formatGamesPlaintext([], label)).toBe('');
  });
});
