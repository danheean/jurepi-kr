import { fairShuffle } from './shuffle';
import type { MergedDeck, Word } from './types';

export type WordResult = 'correct' | 'pass' | 'timeout' | 'unrevealed';

export interface WordWithResult extends Word {
  result: WordResult;
}

export type GameStatus = 'playing' | 'summary';

export interface RoundSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  roundTimeSeconds: number | null;
  shuffle: boolean;
  showHints: boolean;
}

export interface GameState {
  deckId: string;
  words: WordWithResult[];
  currentIndex: number;
  score: {
    correct: number;
    pass: number;
    timeout: number;
  };
  roundSettings: RoundSettings;
  status: GameStatus;
}

/**
 * Start a new game with a deck and settings
 * Returns initial GameState
 */
export function startGame(
  deck: MergedDeck,
  settings: RoundSettings,
  seed: number
): GameState {
  let words = deck.words;

  // Shuffle if requested
  if (settings.shuffle) {
    words = fairShuffle(words, seed);
  }

  return {
    deckId: deck.slug,
    words: words.map((w) => ({ ...w, result: 'unrevealed' })),
    currentIndex: 0,
    score: { correct: 0, pass: 0, timeout: 0 },
    roundSettings: settings,
    status: 'playing',
  };
}

/**
 * Mark current word as correct and advance
 */
export function markCorrect(state: GameState): GameState {
  const newWords = [...state.words];
  newWords[state.currentIndex] = { ...newWords[state.currentIndex]!, result: 'correct' };

  const newIndex = state.currentIndex + 1;
  const isLast = newIndex >= state.words.length;
  const newStatus = isLast ? 'summary' : 'playing';

  return {
    ...state,
    words: newWords,
    currentIndex: newIndex,
    score: { ...state.score, correct: state.score.correct + 1 },
    status: newStatus,
  };
}

/**
 * Mark current word as pass and advance
 */
export function markPass(state: GameState): GameState {
  const newWords = [...state.words];
  newWords[state.currentIndex] = { ...newWords[state.currentIndex]!, result: 'pass' };

  const newIndex = state.currentIndex + 1;
  const isLast = newIndex >= state.words.length;
  const newStatus = isLast ? 'summary' : 'playing';

  return {
    ...state,
    words: newWords,
    currentIndex: newIndex,
    score: { ...state.score, pass: state.score.pass + 1 },
    status: newStatus,
  };
}

/**
 * Undo last action (step back one word, reset result, decrement counter)
 */
export function undo(state: GameState): GameState {
  if (state.currentIndex === 0) {
    return state; // Nothing to undo
  }

  const newIndex = state.currentIndex - 1;
  const wordToReset = state.words[newIndex];
  if (!wordToReset) {
    return state; // Safety check
  }

  const newWords = [...state.words];
  const oldResult = wordToReset.result;
  newWords[newIndex] = { ...wordToReset, result: 'unrevealed' };

  // Decrement appropriate counter
  const newScore = { ...state.score };
  if (oldResult === 'correct') {
    newScore.correct = Math.max(0, newScore.correct - 1);
  } else if (oldResult === 'pass') {
    newScore.pass = Math.max(0, newScore.pass - 1);
  } else if (oldResult === 'timeout') {
    newScore.timeout = Math.max(0, newScore.timeout - 1);
  }

  return {
    ...state,
    words: newWords,
    currentIndex: newIndex,
    score: newScore,
  };
}

/**
 * End game: mark unrevealed words as timeout, transition to summary
 */
export function endGame(state: GameState): GameState {
  const newWords = state.words.map((w) => ({
    ...w,
    result: (w.result === 'unrevealed' ? 'timeout' : w.result) as WordResult,
  }));

  const timeoutCount = newWords.filter((w) => w.result === 'timeout').length;

  return {
    ...state,
    words: newWords,
    score: { ...state.score, timeout: timeoutCount },
    status: 'summary',
  };
}
