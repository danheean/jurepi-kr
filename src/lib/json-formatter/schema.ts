import { z } from 'zod';
import { STORAGE_KEY } from './constants';

/**
 * Format options for JSON output
 */
export const formatOptionsSchema = z.object({
  indent: z.enum(['2', '4', 'tab']).default('2'),
  sortKeys: z.boolean().default(false),
});

export type FormatOptions = z.infer<typeof formatOptionsSchema>;

/**
 * Error details for parse failures
 */
export interface ParseError {
  line: number; // 1-indexed, human-friendly
  column: number; // 1-indexed
  token: string; // the offending token
  context: string; // ~20 chars around error
}

/**
 * Result of JSON parsing/formatting operation
 */
export interface ParseResult {
  success: boolean;
  json?: any; // The parsed JSON object (if success)
  output?: string; // Formatted JSON string (if success)
  error?: ParseError; // Error details (if !success)
}

/**
 * localStorage persistence schema
 */
export const storageSchema = z.object({
  version: z.number().default(1),
  indent: z.enum(['2', '4', 'tab']).default('2'),
  sortKeys: z.boolean().default(false),
  lastInput: z.string().optional(), // opt-in, disabled by default
});

export type StorageState = z.infer<typeof storageSchema>;

/**
 * Parse and validate stored state from JSON
 * Fails gracefully: returns defaults on invalid data
 */
export function parseStorage(json: string): StorageState {
  try {
    const parsed = JSON.parse(json);
    return storageSchema.parse(parsed);
  } catch {
    return {
      version: 1,
      indent: '2',
      sortKeys: false,
    };
  }
}

/**
 * Serialize state to JSON for storage
 */
export function serializeStorage(state: StorageState): string {
  return JSON.stringify(state);
}
