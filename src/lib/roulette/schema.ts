import { z } from 'zod';

export const STORE_VERSION = 1;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 30;
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 1000;
export const LEGEND_THRESHOLD = 16;
export const SPIN_DURATION_MS = 4000;
export const CONFETTI_COUNT = 50;

export const OptionSchema = z.object({
  label: z.string().min(1).max(50),
  weight: z.number().int().min(MIN_WEIGHT).max(MAX_WEIGHT).default(1),
});

export type Option = z.infer<typeof OptionSchema>;

export const OptionSetSchema = z.object({
  name: z.string().min(1).max(50),
  options: z.array(OptionSchema).min(1),
  createdAt: z.number(),
});

export type OptionSet = z.infer<typeof OptionSetSchema>;

export const RouletteStoreSchema = z.object({
  version: z.literal(STORE_VERSION),
  sets: z.record(z.string(), OptionSetSchema),
  lastSetName: z.string().nullable(),
});

export type RouletteStore = z.infer<typeof RouletteStoreSchema>;

/**
 * Parse localStorage JSON into a RouletteStore.
 * On any error (invalid JSON, zod validation), returns a fresh empty store.
 * Never throws.
 */
export function parseStore(raw: string | null): RouletteStore {
  try {
    if (!raw) {
      return freshStore();
    }
    const parsed = JSON.parse(raw);
    return RouletteStoreSchema.parse(parsed);
  } catch {
    return freshStore();
  }
}

/**
 * Create a fresh empty store.
 */
function freshStore(): RouletteStore {
  return {
    version: STORE_VERSION,
    sets: {},
    lastSetName: null,
  };
}
