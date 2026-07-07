import { z } from 'zod';

/**
 * Constants for find-replace domain.
 * CRITICAL: These are referenced in tests and must match the blueprint.
 */
export const STORE_VERSION = 1;
export const STORAGE_KEY = 'jurepi-find-replace';
export const RECENTS_MAX = 10;
export const SAVED_SETS_MAX = 50;
export const APPLY_DEBOUNCE = 150; // ms
export const DEADLINE_MS = 500; // ReDoS guard deadline
export const MAX_TEXT_LENGTH = 200_000; // Security cap
export const RULES_MAX = 100;
export const FLAG_SET = 'imsuy'; // Subset of flags allowed in regex mode

/**
 * Single find-replace rule (React state + localStorage)
 * INVARIANT:
 * - find empty string → rule is a no-op (skip, not error)
 * - isRegex + invalid pattern → per-rule error, skip, others continue
 * - flags ⊆ {i,m,s,u,y}, no duplicates
 * - enabled=false → skip this rule
 */
export const ruleSchema = z.object({
  id: z.string().min(1),
  find: z.string(),
  replace: z.string(),
  isRegex: z.boolean().default(false),
  caseSensitive: z.boolean().default(false),
  wholeWord: z.boolean().default(false),
  firstOnly: z.boolean().default(false),
  flags: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type Rule = z.infer<typeof ruleSchema>;

/**
 * Invalid regex error.
 */
export interface InvalidPatternError {
  code: 'invalid_pattern';
  message: string; // User-facing, engine message included
  pattern: string;
  flags: string;
}

/**
 * Compile result (regex-mode only).
 */
export type CompileResult =
  | { ok: true; regex: RegExp }
  | { ok: false; error: InvalidPatternError };

/**
 * Single rule application result.
 */
export interface RuleApplyResult {
  text: string; // Text after rule applied
  count: number; // Replacement count
  spans?: Array<{ index: number; length: number }>; // Replacement ranges in THIS rule's OUTPUT text
  edits?: Array<{ inStart: number; inLen: number; outStart: number; outLen: number }>; // For remapping prior spans through this rule's edits
  error?: InvalidPatternError; // Null if success
}

/**
 * Multiple rules sequential application result.
 */
export interface ApplyRulesResult {
  output: string; // Final text
  perRuleCounts: Array<{ ruleId: string; count: number; error?: InvalidPatternError }>;
  spans: Array<{ index: number; length: number }>; // Highlight ranges on final output
  totalCount: number;
  timedOut?: boolean; // True if a regex rule exceeded deadline
}

/**
 * Preset (curated rule-set or built-in transform).
 */
export type PresetKind = 'ruleset' | 'builtin';

export type TransformId =
  | 'to-js-string'
  | 'from-js-string'
  | 'normalize-quotes'
  | 'fullwidth-to-halfwidth'
  | 'strip-blank-lines'
  | 'collapse-spaces'
  | 'strip-line-numbers'
  | 'lines-to-array-items';

export interface Preset {
  id: string;
  labelKey: string; // i18n key
  kind: PresetKind;
  rules?: Rule[];
  transform?: TransformId;
  sampleKey?: string; // i18n key for demonstration sample
}

/**
 * Saved rule set (localStorage).
 */
export interface SavedRuleSet {
  name: string;
  rules: Rule[];
}

/**
 * Find-replace store schema (localStorage).
 */
export const storeSchema = z.object({
  version: z.number().default(STORE_VERSION),
  // Current working rules — persisted so an in-progress rule list survives a reload
  // (an enhancement over the SPEC store, which listed only savedSets/recents).
  // Optional for backward compatibility with stores written before this field existed.
  rules: z.array(ruleSchema).max(RULES_MAX).optional(),
  savedSets: z.array(
    z.object({
      name: z.string().min(1).max(100),
      rules: z.array(ruleSchema),
    })
  ).max(SAVED_SETS_MAX),
  recents: z.array(z.string()).max(RECENTS_MAX),
  meta: z.object({ createdAt: z.number() }),
});

export type FindReplaceStore = z.infer<typeof storeSchema>;

/**
 * Parse store from JSON string.
 * Fail gracefully: return empty store on parse error.
 */
export function parseStore(json: string): FindReplaceStore {
  try {
    const parsed = JSON.parse(json);
    return storeSchema.parse(parsed);
  } catch {
    return {
      version: STORE_VERSION,
      rules: [],
      savedSets: [],
      recents: [],
      meta: { createdAt: Date.now() },
    };
  }
}

/**
 * Serialize store to JSON.
 */
export function serializeStore(store: FindReplaceStore): string {
  return JSON.stringify(store);
}
