import { z } from 'zod';

export const RECENTS_MAX = 10;
export const INPUT_MAX_LEN = 10000;
export const BATCH_MAX_LINES = 100;
export const STORE_VERSION = 1;
export const STORAGE_KEY = 'jurepi-url-encoder';

/**
 * Input schema for encoding/decoding operation.
 */
export const inputSchema = z.object({
  text: z.string().max(INPUT_MAX_LEN),
  direction: z.enum(['encode', 'decode']),
  mode: z.enum(['component', 'uri']),
  charset: z.enum(['utf-8', 'euc-kr']).default('utf-8'),
  plusAsSpace: z.boolean().optional(),
  batchMode: z.boolean().optional(),
});

export type InputSchema = z.infer<typeof inputSchema>;

/**
 * Query table row.
 */
export interface QueryTableRow {
  key: string;
  value: string;
}

export const queryTableRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const queryTableSchema = z.object({
  rows: z.array(queryTableRowSchema),
});

export type QueryTableSchema = z.infer<typeof queryTableSchema>;

/**
 * Encode result.
 */
export interface EncodeResult {
  result?: string;
  alreadyEncodedHint: boolean;
  error?: { message: string; details: string } | null;
}

/**
 * Decode result.
 */
export interface DecodeResult {
  result?: string;
  error?: { message: string; details: string } | null;
}

/**
 * Store schema for localStorage persistence.
 */
export const storeSchema = z.object({
  version: z.number().default(STORE_VERSION),
  recents: z.array(z.string()),
  meta: z.object({
    createdAt: z.number(),
  }),
});

export type StoreRecents = z.infer<typeof storeSchema>;

/**
 * Parse and validate store data from JSON.
 * Fail gracefully: return empty recents on invalid data.
 */
export function parseStore(json: string): StoreRecents {
  try {
    const parsed = JSON.parse(json);
    return storeSchema.parse(parsed);
  } catch {
    return {
      version: STORE_VERSION,
      recents: [],
      meta: { createdAt: Date.now() },
    };
  }
}

/**
 * Serialize store to JSON.
 */
export function serializeStore(store: StoreRecents): string {
  return JSON.stringify(store);
}
