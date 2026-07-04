/**
 * Character Counter Domain Types
 * Pure TypeScript interfaces with no React dependencies.
 */

/**
 * Computed metrics for a given text.
 */
export interface CharacterCounterMetrics {
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  byteSize: number; // UTF-8 byte count
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

/**
 * A preset or custom character limit.
 */
export interface PresetLimit {
  id: 'twitter' | 'meta_description' | 'custom' | 'none';
  label: string; // Localized label
  limit: number | null; // null for "none"
  description?: string;
}

/**
 * Persisted state to localStorage.
 */
export interface CounterStore {
  version: number;
  lastText: string;
  lastLimit: { id: string; limit: number | null } | null;
  readWPM: number;
  speakWPM: number;
}

/**
 * Hook state shape (extends the domain types).
 */
export interface CounterState {
  text: string;
  metrics: CharacterCounterMetrics;
  limit: PresetLimit | null;
  customLimitInput: string;
  isLoading: boolean;
}
