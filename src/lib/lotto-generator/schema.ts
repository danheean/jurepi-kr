import { z } from 'zod';

// Constants
export const GAME_COUNT_MIN = 1;
export const GAME_COUNT_MAX = 10;
export const FIXED_MAX = 5;
export const EXCLUDED_MAX = 39;
export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;
export const NUMBERS_PER_GAME = 6;
export const HISTORY_MAX = 20;
export const BALL_POP_DURATION_MS = 150;
export const BALL_STAGGER_MS = 100;
export const BEEP_FREQ_HZ = 900;
export const STORE_VERSION = 1;
export const STORAGE_KEY = 'jurepi-lotto-generator';

// Single lottery draw: 6 unique sorted numbers from 1–45
export type Draw = number[];

export const DrawSchema = z
  .array(z.number().int().min(LOTTO_MIN).max(LOTTO_MAX))
  .length(NUMBERS_PER_GAME)
  .refine((arr) => new Set(arr).size === arr.length, 'Draw must have unique numbers')
  .refine((arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return arr.every((v, i) => v === sorted[i]);
  }, 'Draw must be sorted ascending');

// User input for generating draws
export interface Settings {
  gameCount: number;
  fixedNumbers: number[];
  excludedNumbers: number[];
}

export const SettingsSchema = z.object({
  gameCount: z.number().int().min(GAME_COUNT_MIN).max(GAME_COUNT_MAX),
  fixedNumbers: z
    .array(z.number().int().min(LOTTO_MIN).max(LOTTO_MAX))
    .max(FIXED_MAX)
    .refine((arr) => new Set(arr).size === arr.length, 'Fixed numbers must be unique'),
  excludedNumbers: z
    .array(z.number().int().min(LOTTO_MIN).max(LOTTO_MAX))
    .max(EXCLUDED_MAX)
    .refine((arr) => new Set(arr).size === arr.length, 'Excluded numbers must be unique'),
});

// Result of one generation session
export interface DrawResult {
  games: Draw[];
  settings: Settings;
}

export const DrawResultSchema = z.object({
  games: z.array(DrawSchema),
  settings: SettingsSchema,
});

// Persisted history entry
export interface HistoryEntry {
  timestamp: string; // ISO 8601
  gameCount: number;
  fixedNumbers: number[];
  excludedNumbers: number[];
  games: Draw[];
}

export const HistoryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  gameCount: z.number().int().min(GAME_COUNT_MIN).max(GAME_COUNT_MAX),
  fixedNumbers: z
    .array(z.number().int().min(LOTTO_MIN).max(LOTTO_MAX))
    .max(FIXED_MAX),
  excludedNumbers: z
    .array(z.number().int().min(LOTTO_MIN).max(LOTTO_MAX))
    .max(EXCLUDED_MAX),
  games: z.array(DrawSchema),
});

// Client localStorage schema
export interface LottoStore {
  version: number;
  history: HistoryEntry[];
  lastSettings: Settings | null;
}

export const LottoStoreSchema = z.object({
  version: z.number().int().min(STORE_VERSION).max(STORE_VERSION),
  history: z.array(HistoryEntrySchema).max(HISTORY_MAX),
  lastSettings: SettingsSchema.nullable(),
});

/**
 * Parse localStorage JSON string.
 * On any error, returns fresh empty store (never throws).
 * Prunes invalid history entries but keeps valid ones.
 */
export function parseStore(raw: string | null): LottoStore {
  const freshStore: LottoStore = {
    version: STORE_VERSION,
    history: [],
    lastSettings: null,
  };

  if (!raw) return freshStore;

  try {
    const parsed = JSON.parse(raw);

    // Check version first
    if (parsed.version !== STORE_VERSION) {
      return freshStore;
    }

    // Validate and prune history entries individually
    const validHistory: HistoryEntry[] = [];
    if (Array.isArray(parsed.history)) {
      parsed.history.forEach((entry: any) => {
        try {
          const validEntry = HistoryEntrySchema.parse(entry);
          validHistory.push(validEntry);
        } catch {
          // Skip invalid entries
        }
      });
    }

    // Validate lastSettings
    let lastSettings: Settings | null = null;
    if (parsed.lastSettings) {
      try {
        lastSettings = SettingsSchema.parse(parsed.lastSettings);
      } catch {
        // Skip invalid lastSettings
      }
    }

    return {
      version: STORE_VERSION,
      history: validHistory.slice(0, HISTORY_MAX),
      lastSettings,
    };
  } catch {
    // Silently return fresh store on any error
    return freshStore;
  }
}
