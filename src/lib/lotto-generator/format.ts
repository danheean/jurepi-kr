import type { Draw } from './schema';

/**
 * Format a list of games as plaintext for clipboard copy.
 * Pure: the per-game label is injected so the domain stays i18n-free.
 *
 * Example output (gameLabel = (i) => `Game ${i + 1}`):
 *   Game 1: 2, 7, 18, 34, 41, 44
 *   Game 2: 5, 11, 23, 30, 38, 45
 *
 * @param games - Array of draws (each 6 sorted numbers)
 * @param gameLabel - Maps zero-based index to a label (e.g. "Game 1" / "게임 1")
 * @returns Newline-joined plaintext (no trailing newline)
 */
export function formatGamesPlaintext(
  games: Draw[],
  gameLabel: (index: number) => string,
): string {
  return games
    .map((game, index) => `${gameLabel(index)}: ${game.join(', ')}`)
    .join('\n');
}
