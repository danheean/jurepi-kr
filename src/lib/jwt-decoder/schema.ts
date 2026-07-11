import { z } from 'zod';

/**
 * UI preferences persisted to localStorage
 * Token and secrets are NEVER persisted — only UI state
 */
export const uiPrefsSchema = z.object({
  tab: z.enum(['claims', 'raw']).default('claims'),
  verificationMode: z.enum(['off', 'hmac', 'rsa']).default('off'),
});

export type UiPrefs = z.infer<typeof uiPrefsSchema>;

/**
 * Parse and validate stored UI preferences from JSON
 * Fails gracefully: returns defaults on invalid data
 */
export function parseUiPrefs(json: string): UiPrefs {
  try {
    const parsed = JSON.parse(json);
    return uiPrefsSchema.parse(parsed);
  } catch {
    return {
      tab: 'claims',
      verificationMode: 'off',
    };
  }
}

/**
 * Serialize UI preferences to JSON for storage
 */
export function serializeUiPrefs(prefs: UiPrefs): string {
  return JSON.stringify(prefs);
}
