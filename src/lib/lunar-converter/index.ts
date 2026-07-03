/**
 * Lunar Converter Domain Layer
 * Pure TypeScript domain logic for solar↔lunar conversion.
 *
 * Public API exports for UI, platform, and hook layers.
 */

// Schema & Types
export type { ConversionErrorCode, ConversionError, DateRecord, LunarDateRecord, Sexagenary, Zodiac, ConversionResult, RecentEntry, RecentsStore } from './schema';
export { parseRecentsStore, RecentsStoreSchema } from './schema';

// Conversion functions (async, stateful lib wrapper)
export { solarToLunar, lunarToSolar } from './conversion';
export type { LunarEngine } from './conversion';

// Pure sexagenary computation
export { computeSexagenary } from './sexagenary';

// Pure zodiac computation
export { computeZodiac } from './zodiac';

// Recents management (immutable operations)
export { pushRecent, pruneUnknown, loadRecents, serializeRecents, deserializeRecents, formatSolarDate, formatLunarDate } from './recents';
