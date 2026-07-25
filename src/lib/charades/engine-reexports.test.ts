import { describe, it, expect } from 'vitest';
import { fairShuffle } from './shuffle';
import { startGame, markCorrect, markPass, undo, endGame } from './game-reducer';
import { toneSpec, SOUND_TICK_HZ } from './sound';
import { toggleFavorite, pushRecent, pruneUnknown, RECENTS_MAX } from './favorites';
import { slugify, resolveSlug } from './slug';

/**
 * charades' engine files are thin re-exports of src/lib/party-word-game/*.
 * These smoke tests confirm the re-export surface is intact — full behavioral
 * coverage lives in src/lib/party-word-game/*.test.ts (single source of truth).
 */
describe('charades engine re-exports — surface smoke test', () => {
  it('shuffle: fairShuffle is exported and callable', () => {
    const result = fairShuffle([{ term: 'a' }, { term: 'b' }], 1);
    expect(result).toHaveLength(2);
  });

  it('game-reducer: full lifecycle is exported and callable', () => {
    const deck = { slug: 'x', words: [{ term: 'a' }, { term: 'b' }] };
    const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
    let state = startGame(deck, settings, 1);
    state = markCorrect(state);
    state = markPass(state);
    state = undo(state);
    state = endGame(state);
    expect(state.status).toBe('summary');
  });

  it('sound: toneSpec is exported and callable', () => {
    expect(toneSpec('tick').freqHz).toBe(SOUND_TICK_HZ);
  });

  it('favorites: all ops exported and callable', () => {
    expect(toggleFavorite([], 'a')).toEqual(['a']);
    expect(pushRecent([], 'a')).toEqual(['a']);
    expect(pruneUnknown(['a'], [])).toEqual([]);
    expect(RECENTS_MAX).toBe(10);
  });

  it('slug: slugify/resolveSlug exported and callable', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(resolveSlug({}, 'actions-a.md')).toBe('actions-a');
  });
});
