/**
 * Structural (content-agnostic) shapes shared by every "reveal a word, mark
 * correct/pass, countdown timer" party game (speed-quiz, charades, ...).
 * Tool-specific schemas (category/difficulty enums, ko/en fields) live in
 * each tool's own `src/lib/<tool>/schema.ts` — those richer types are
 * structurally compatible with these (a superset), so passing a tool's own
 * MergedDeck into these functions type-checks without casting.
 */

export interface Word {
  term: string;
  hint?: string;
}

export interface DeckFile {
  slug?: string;
}

export interface MergedDeck {
  slug: string;
  words: Word[];
}
