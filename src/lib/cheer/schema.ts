import { z } from 'zod';

/**
 * Color swatch palette for text and background colors.
 * All values from DESIGN.md tokens.css.
 */
export type ColorSwatchId = 'white' | 'black' | 'coral' | 'sun' | 'sky' | 'grape' | 'rose';

export type CheerSize = 'S' | 'M' | 'L' | 'XL';

/** Manual = user picks S/M/L/XL directly. Auto = size is derived from text length + deviceType. */
export type SizeMode = 'manual' | 'auto';

/** Assumed display device — auto sizing holds larger buckets longer on the wider tablet class. */
export type DeviceType = 'mobile' | 'tablet';

/**
 * Cheer message display settings — immutable.
 */
export interface CheerSettings {
  text: string; // 1..80 chars, user message
  textColor: ColorSwatchId;
  bgColor: ColorSwatchId;
  effect: 'static' | 'scroll' | 'flash' | 'neon';
  speed: 'slow' | 'medium' | 'fast';
  size: CheerSize; // effective value when sizeMode='manual'; last manual pick otherwise
  sizeMode: SizeMode;
  deviceType: DeviceType;
}

/**
 * Cheer store persisted to localStorage.
 */
export interface CheerStore {
  version: number;
  recents: string[]; // max MAX_RECENTS, MRU order, deduped
  lastSettings: CheerSettings;
}

/**
 * Constants for validation and defaults
 */
export const MIN_LEN = 1;
export const MAX_LEN = 80;
export const MAX_RECENTS = 10;
export const STORE_VERSION = 2; // v2 adds sizeMode + deviceType (auto font-size feature)
export const MIN_CONTRAST = 3.0;

/**
 * Animation durations by speed level (milliseconds).
 */
export const SCROLL_MS = {
  slow: 12000,
  medium: 8000,
  fast: 4000,
} as const;

export const FLASH_MS = {
  slow: 1200,
  medium: 700,
  fast: 350,
} as const;

/**
 * Font size scale by size level using clamp() for responsiveness.
 * Format: clamp(min, preferred, max)
 */
export const SIZE_SCALE = {
  S: 'clamp(2rem, 10vw, 4rem)',
  M: 'clamp(3rem, 14vw, 6rem)',
  L: 'clamp(4rem, 20vw, 9rem)',
  XL: 'clamp(5rem, 28vw, 14rem)',
} as const;

/**
 * Zod schema for CheerSettings validation
 */
export const cheerSettingsSchema: z.ZodType<CheerSettings> = z.object({
  text: z.string().min(MIN_LEN).max(MAX_LEN),
  textColor: z.enum(['white', 'black', 'coral', 'sun', 'sky', 'grape', 'rose']),
  bgColor: z.enum(['white', 'black', 'coral', 'sun', 'sky', 'grape', 'rose']),
  effect: z.enum(['static', 'scroll', 'flash', 'neon']).default('scroll'),
  speed: z.enum(['slow', 'medium', 'fast']).default('medium'),
  size: z.enum(['S', 'M', 'L', 'XL']).default('L'),
  sizeMode: z.enum(['manual', 'auto']).default('manual'),
  deviceType: z.enum(['mobile', 'tablet']).default('mobile'),
});

/**
 * Zod schema for CheerStore validation
 */
export const cheerStoreSchema: z.ZodType<CheerStore> = z.object({
  version: z.number().int().min(1),
  recents: z.array(z.string()).default([]),
  lastSettings: cheerSettingsSchema,
});

/**
 * Default CheerSettings
 */
export const DEFAULT_SETTINGS: CheerSettings = {
  text: '',
  textColor: 'white',
  bgColor: 'black',
  effect: 'scroll',
  speed: 'medium',
  size: 'L',
  sizeMode: 'manual',
  deviceType: 'mobile',
};

/**
 * Type inference helpers
 */
export type CheerSettingsInput = z.infer<typeof cheerSettingsSchema>;
export type CheerStoreInput = z.infer<typeof cheerStoreSchema>;
