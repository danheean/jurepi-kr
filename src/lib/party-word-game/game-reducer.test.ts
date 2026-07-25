import { describe, it, expect } from 'vitest';
import { startGame, markCorrect, markPass, undo, endGame } from './game-reducer';
import type { Word } from './types';

describe('game-reducer — immutable game state transitions', () => {
  const mockWords: Word[] = Array.from({ length: 10 }, (_, i) => ({
    term: `word${i}`,
    hint: i === 0 ? 'hint0' : undefined,
  }));

  // Deliberately untyped (structural inference): mirrors a tool's own richer
  // MergedDeck shape (category/difficulty/ko/en) — proves these functions
  // accept any superset of {slug, words}, not just the generic shape.
  const mockDeck = {
    slug: 'test-deck',
    category: 'animals',
    difficulty: 'easy',
    words: mockWords,
    ko: { title: 'Test', words: mockWords },
    en: { title: 'Test', words: mockWords },
  };

  describe('startGame', () => {
    it('initializes game state with deck and settings', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);

      expect(state.deckId).toBe('test-deck');
      expect(state.currentIndex).toBe(0);
      expect(state.status).toBe('playing');
      expect(state.score).toEqual({ correct: 0, pass: 0, timeout: 0 });
      expect(state.words).toHaveLength(10);
    });

    it('marks all words as unrevealed initially', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);

      expect(state.words.every((w) => w.result === 'unrevealed')).toBe(true);
    });

    it('shuffles words when shuffle=true', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: true, showHints: false };
      const state1 = startGame(mockDeck, settings, 42);
      const state2 = startGame(mockDeck, settings, 43);

      const order1 = state1.words.map((w) => w.term);
      const order2 = state2.words.map((w) => w.term);

      expect(order1).not.toEqual(order2);
    });

    it('does not shuffle when shuffle=false', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);

      expect(state.words.map((w) => w.term)).toEqual(mockWords.map((w) => w.term));
    });

    it('preserves word hints', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: true };
      const state = startGame(mockDeck, settings, 42);

      expect(state.words[0]?.hint).toBe('hint0');
      expect(state.words[1]?.hint).toBeUndefined();
    });

    it('stores round settings', () => {
      const settings = { difficulty: 'hard' as const, roundTimeSeconds: 90, shuffle: true, showHints: true };
      const state = startGame(mockDeck, settings, 42);

      expect(state.roundSettings).toEqual(settings);
    });

    it('reproducible with same seed', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: true, showHints: false };
      const state1 = startGame(mockDeck, settings, 42);
      const state2 = startGame(mockDeck, settings, 42);

      expect(state1.words.map((w) => w.term)).toEqual(state2.words.map((w) => w.term));
    });
  });

  describe('markCorrect', () => {
    it('marks current word as correct', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = markCorrect(state);

      expect(next.words[0]?.result).toBe('correct');
    });

    it('increments correct score', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = markCorrect(state);

      expect(next.score.correct).toBe(1);
    });

    it('advances to next word', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = markCorrect(state);

      expect(next.currentIndex).toBe(1);
    });

    it('transitions to summary on last word', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);

      for (let i = 0; i < 9; i++) {
        state = markCorrect(state);
      }
      expect(state.status).toBe('playing');

      state = markCorrect(state);
      expect(state.status).toBe('summary');
    });

    it('does not mutate input state', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const original = JSON.stringify(state);

      markCorrect(state);

      expect(JSON.stringify(state)).toBe(original);
    });
  });

  describe('markPass', () => {
    it('marks current word as pass', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = markPass(state);

      expect(next.words[0]?.result).toBe('pass');
    });

    it('increments pass score', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = markPass(state);

      expect(next.score.pass).toBe(1);
    });

    it('advances to next word', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = markPass(state);

      expect(next.currentIndex).toBe(1);
    });
  });

  describe('undo', () => {
    it('does nothing if at index 0', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = undo(state);

      expect(next.currentIndex).toBe(0);
      expect(next.score).toEqual(state.score);
    });

    it('steps back one word', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      expect(state.currentIndex).toBe(1);

      state = undo(state);
      expect(state.currentIndex).toBe(0);
    });

    it('resets word to unrevealed', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      expect(state.words[0]?.result).toBe('correct');

      state = undo(state);
      expect(state.words[0]?.result).toBe('unrevealed');
    });

    it('decrements correct counter', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      state = markCorrect(state);
      expect(state.score.correct).toBe(2);

      state = undo(state);
      expect(state.score.correct).toBe(1);
    });

    it('decrements pass counter', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markPass(state);
      state = markPass(state);
      expect(state.score.pass).toBe(2);

      state = undo(state);
      expect(state.score.pass).toBe(1);
    });

    it('does not affect other words', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      state = markPass(state);
      const word2Original = state.words[2]; // Save word at index 2 (unchanged)

      state = undo(state);
      expect(state.words[2]).toEqual(word2Original); // Word 2 should not change
    });
  });

  describe('endGame', () => {
    it('marks unrevealed words as timeout', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      state = markPass(state);
      // 8 words still unrevealed

      state = endGame(state);

      const timeouts = state.words.filter((w) => w.result === 'timeout');
      expect(timeouts).toHaveLength(8);
    });

    it('counts timeout words in score', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      state = markPass(state);
      expect(state.score.timeout).toBe(0);

      state = endGame(state);
      expect(state.score.timeout).toBe(8);
    });

    it('transitions to summary', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state = startGame(mockDeck, settings, 42);
      const next = endGame(state);

      expect(next.status).toBe('summary');
    });

    it('preserves correct and pass scores', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      let state = startGame(mockDeck, settings, 42);
      state = markCorrect(state);
      state = markCorrect(state);
      state = markPass(state);

      const beforeEnd = { ...state.score };
      state = endGame(state);

      expect(state.score.correct).toBe(beforeEnd.correct);
      expect(state.score.pass).toBe(beforeEnd.pass);
    });
  });

  describe('state immutability', () => {
    it('all operations return new state objects', () => {
      const settings = { difficulty: 'easy' as const, roundTimeSeconds: 60, shuffle: false, showHints: false };
      const state1 = startGame(mockDeck, settings, 42);
      const state2 = markCorrect(state1);
      const state3 = markPass(state2);
      const state4 = undo(state3);

      expect(state1).not.toBe(state2);
      expect(state2).not.toBe(state3);
      expect(state3).not.toBe(state4);
    });
  });
});
