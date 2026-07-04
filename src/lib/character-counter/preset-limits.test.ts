/**
 * Preset Limits Tests
 */

import { describe, it, expect } from 'vitest';
import {
  TWITTER_LIMIT,
  META_DESCRIPTION_LIMIT,
  STORAGE_MAX_LENGTH,
  DEBOUNCE_MS,
  DEFAULT_READ_WPM,
  DEFAULT_SPEAK_WPM,
  STORE_VERSION,
  getPresetLimit,
  createCustomLimit,
  limitStatus,
} from './preset-limits';

describe('Preset Limits Constants', () => {
  it('should have correct TWITTER_LIMIT', () => {
    expect(TWITTER_LIMIT).toBe(280);
  });

  it('should have correct META_DESCRIPTION_LIMIT', () => {
    expect(META_DESCRIPTION_LIMIT).toBe(160);
  });

  it('should have correct STORAGE_MAX_LENGTH', () => {
    expect(STORAGE_MAX_LENGTH).toBe(100000);
  });

  it('should have correct DEBOUNCE_MS', () => {
    expect(DEBOUNCE_MS).toBe(300);
  });

  it('should have correct DEFAULT_READ_WPM', () => {
    expect(DEFAULT_READ_WPM).toBe(200);
  });

  it('should have correct DEFAULT_SPEAK_WPM', () => {
    expect(DEFAULT_SPEAK_WPM).toBe(130);
  });

  it('should have correct STORE_VERSION', () => {
    expect(STORE_VERSION).toBe(1);
  });
});

describe('getPresetLimit', () => {
  it('should return Twitter limit', () => {
    const limit = getPresetLimit('twitter');
    expect(limit.id).toBe('twitter');
    expect(limit.limit).toBe(280);
    expect(limit.label).toContain('Twitter');
  });

  it('should return Meta description limit', () => {
    const limit = getPresetLimit('meta_description');
    expect(limit.id).toBe('meta_description');
    expect(limit.limit).toBe(160);
    expect(limit.label).toContain('Meta');
  });

  it('should return None limit', () => {
    const limit = getPresetLimit('none');
    expect(limit.id).toBe('none');
    expect(limit.limit).toBe(null);
  });
});

describe('createCustomLimit', () => {
  it('should create custom limit with number', () => {
    const limit = createCustomLimit(500);
    expect(limit.id).toBe('custom');
    expect(limit.limit).toBe(500);
    expect(limit.label).toContain('500');
  });

  it('should create custom limit with null', () => {
    const limit = createCustomLimit(null);
    expect(limit.id).toBe('custom');
    expect(limit.limit).toBeNull();
  });

  it('should create custom limit with 0', () => {
    const limit = createCustomLimit(0);
    expect(limit.id).toBe('custom');
    expect(limit.limit).toBe(0);
  });
});

describe('limitStatus', () => {
  it('should return "under" for null limit', () => {
    expect(limitStatus(100, null)).toBe('under');
  });

  it('should return "under" for undefined limit', () => {
    expect(limitStatus(100, undefined)).toBe('under');
  });

  it('should return "under" when count is <80% of limit', () => {
    expect(limitStatus(79, 100)).toBe('under');
    expect(limitStatus(159, 200)).toBe('under');
  });

  it('should return "near" when count is >=80% and <=100% of limit', () => {
    expect(limitStatus(160, 200)).toBe('near'); // Exactly 80%
    expect(limitStatus(161, 200)).toBe('near'); // Just over 80%
    expect(limitStatus(200, 200)).toBe('near'); // Exactly 100%
  });

  it('should return "near" at exactly 80%', () => {
    expect(limitStatus(80, 100)).toBe('near'); // 80% is boundary, >= 80
    expect(limitStatus(81, 100)).toBe('near'); // Over 80%
  });

  it('should return "over" when count exceeds limit', () => {
    expect(limitStatus(201, 200)).toBe('over');
    expect(limitStatus(300, 200)).toBe('over');
  });

  it('should handle zero limit', () => {
    expect(limitStatus(0, 0)).toBe('under'); // 0/0 is NaN, NaN>100 is false and NaN>=80 is false
    expect(limitStatus(1, 0)).toBe('over'); // 1/0 is Infinity > 100
  });

  it('should handle zero count', () => {
    expect(limitStatus(0, 100)).toBe('under');
  });

  it('should handle large numbers', () => {
    expect(limitStatus(10000, 100000)).toBe('under');
    expect(limitStatus(85000, 100000)).toBe('near');
    expect(limitStatus(101000, 100000)).toBe('over');
  });

  it('should handle Twitter limit threshold', () => {
    expect(limitStatus(223, 280)).toBe('under'); // <80%
    expect(limitStatus(224, 280)).toBe('near'); // Exactly 80%
    expect(limitStatus(225, 280)).toBe('near'); // Just over 80%
    expect(limitStatus(280, 280)).toBe('near'); // 100%
    expect(limitStatus(281, 280)).toBe('over'); // Over limit
  });

  it('should handle Meta description limit threshold', () => {
    expect(limitStatus(127, 160)).toBe('under'); // <80%
    expect(limitStatus(128, 160)).toBe('near'); // Exactly 80%
    expect(limitStatus(129, 160)).toBe('near'); // Just over 80%
    expect(limitStatus(160, 160)).toBe('near'); // 100%
    expect(limitStatus(161, 160)).toBe('over'); // Over limit
  });
});
