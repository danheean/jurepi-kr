/**
 * Everyone's Cheer (모두의 응원) — Domain Layer
 * Pure, framework-agnostic, 100% TDD-built business logic.
 * No React, no Next, no DOM, no side effects.
 */

// Schema & Types
export {
  type CheerSettings,
  type CheerStore,
  type CheerSettingsInput,
  type CheerStoreInput,
  type ColorSwatchId,
  type CheerSize,
  type SizeMode,
  type DeviceType,
  cheerSettingsSchema,
  cheerStoreSchema,
  DEFAULT_SETTINGS,
  MIN_LEN,
  MAX_LEN,
  MAX_RECENTS,
  STORE_VERSION,
  MIN_CONTRAST,
  SCROLL_MS,
  FLASH_MS,
  SIZE_SCALE,
} from './schema';

// Auto font-size (text length + device type → S/M/L/XL)
export { suggestAutoSize, resolveEffectiveSize } from './size';

// Presets
export {
  type PresetPhrase,
  PRESET_PHRASES,
  getPresetsByCategory,
} from './presets';

// Recents (MRU operations) — constants re-exported from schema (single source)
export { addRecent, pruneRecents } from './recents';

// Sanitization
export { normalizeMessage, isValidMessage } from './sanitize';

// Contrast & Accessibility
export { relativeLuminance, contrastRatio, isLowContrast } from './contrast';
