/**
 * Preset character limits and utility functions.
 */

import type { PresetLimit } from './types';

// Preset constants
export const TWITTER_LIMIT = 280;
export const META_DESCRIPTION_LIMIT = 160;
export const STORAGE_MAX_LENGTH = 100000;
export const DEBOUNCE_MS = 300;
export const DEFAULT_READ_WPM = 200;
export const DEFAULT_SPEAK_WPM = 130;
export const STORE_VERSION = 1;

/**
 * Get a preset limit by ID.
 * Note: label is placeholder; UI will localize via i18n.
 */
export function getPresetLimit(
  id: 'twitter' | 'meta_description' | 'none'
): PresetLimit {
  switch (id) {
    case 'twitter':
      return {
        id: 'twitter',
        label: 'Twitter (280)',
        limit: TWITTER_LIMIT,
        description: 'X allows 280 characters per post',
      };
    case 'meta_description':
      return {
        id: 'meta_description',
        label: 'Meta Description (160)',
        limit: META_DESCRIPTION_LIMIT,
        description: 'Meta descriptions are typically limited to 160 characters',
      };
    case 'none':
      return {
        id: 'none',
        label: 'None',
        limit: null,
      };
    default:
      return {
        id: 'none',
        label: 'None',
        limit: null,
      };
  }
}

/**
 * Create a custom limit object.
 */
export function createCustomLimit(limitNumber: number | null): PresetLimit {
  return {
    id: 'custom',
    label: `Custom (${limitNumber})`,
    limit: limitNumber,
  };
}

/**
 * Determine the status of a character count relative to a limit.
 * Returns: 'under' (≤80%), 'near' (80–100%), 'over' (>100%).
 * If limit is null, always returns 'under'.
 */
export function limitStatus(
  count: number,
  limit: number | null | undefined
): 'under' | 'near' | 'over' {
  if (limit === null || limit === undefined) {
    return 'under';
  }

  const percent = (count / limit) * 100;
  if (percent > 100) {
    return 'over';
  }
  if (percent >= 80) {
    return 'near';
  }
  return 'under';
}
