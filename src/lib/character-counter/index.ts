/**
 * Character Counter Domain Layer - Public API
 */

export {
  countCharacters,
  countCharactersNoSpaces,
  countWords,
  countSentences,
  countParagraphs,
  countLines,
  getByteSize,
  estimateReadingTime,
  estimateSpeakingTime,
  computeMetrics,
} from './counter';

export { countGraphemes } from './segmenter';

export {
  TWITTER_LIMIT,
  META_DESCRIPTION_LIMIT,
  STORAGE_MAX_LENGTH,
  DEBOUNCE_MS,
  DEFAULT_READ_WPM,
  DEFAULT_SPEAK_WPM,
  STORE_VERSION,
  getPresetLimit,
  createCustomLimit,
  limitStatus,
} from './preset-limits';

export type {
  CharacterCounterMetrics,
  PresetLimit,
  CounterStore,
  CounterState,
} from './types';
