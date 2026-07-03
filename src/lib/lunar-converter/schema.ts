import { z } from 'zod';

/**
 * Error codes for conversion failures.
 * Resolved to i18n messages by UI.
 */
export type ConversionErrorCode = 'out_of_range' | 'no_leap_month' | 'invalid_date';

export interface ConversionError {
  error: ConversionErrorCode;
}

/**
 * Date record: solar or lunar date with year, month, day.
 */
export interface DateRecord {
  year: number;
  month: number;
  day: number;
}

/**
 * Lunar date record includes intercalation (leap month) flag.
 */
export interface LunarDateRecord extends DateRecord {
  isLeap: boolean;
}

/**
 * Sexagenary (60-cycle): 천간(stem) + 지지(branch)
 * Stem indices 0-9 (甲..癸), branch indices 0-11 (子..亥)
 */
export interface Sexagenary {
  name: string; // e.g. "갑진"
  hanja: string; // e.g. "甲辰"
  english: string; // e.g. "Wood Dragon"
  stemIndex: number; // 0-9
  branchIndex: number; // 0-11
}

/**
 * Zodiac animal: 12-year cycle.
 * Branch index corresponds to zodiac (0=rat, 1=ox, ..., 11=pig)
 */
export interface Zodiac {
  key: string; // e.g. "dragon"
  emoji: string; // e.g. "🐉"
  branchIndex: number; // 0-11
}

/**
 * Full conversion result from solar to lunar (or vice versa).
 * Includes sexagenary and zodiac computed from the lunar year.
 */
export interface ConversionResult {
  solarDate: DateRecord;
  lunarDate: LunarDateRecord;
  sexagenary: Sexagenary;
  zodiac: Zodiac;
}

/**
 * Recent conversion entry: solar + lunar pair with timestamp.
 */
export interface RecentEntry {
  solarDate: string; // YYYY-MM-DD
  lunarDate: string; // YYYY-MM-DD
  ts: number; // milliseconds
}

/**
 * Recents store schema: version + array of recent entries.
 */
export const RecentsStoreSchema = z.object({
  version: z.literal(1),
  entries: z.array(
    z.object({
      solarDate: z.string(),
      lunarDate: z.string(),
      ts: z.number(),
    })
  ),
});

export type RecentsStore = z.infer<typeof RecentsStoreSchema>;

/**
 * Parse unknown input to RecentsStore.
 * Fail-gracefully: invalid input → fresh empty store.
 */
export function parseRecentsStore(raw: unknown): RecentsStore {
  const result = RecentsStoreSchema.safeParse(raw);
  if (result.success) {
    return result.data;
  }

  // Fresh store on parse failure
  return {
    version: 1,
    entries: [],
  };
}
