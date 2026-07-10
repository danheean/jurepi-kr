import { describe, it, expect } from 'vitest';
import { TIMEZONE_NAMES } from './timezone-list';

describe('TIMEZONE_NAMES smoke tests', () => {
  it('should have non-empty timezone list', () => {
    expect(TIMEZONE_NAMES).toBeDefined();
    expect(Array.isArray(TIMEZONE_NAMES)).toBe(true);
    expect(TIMEZONE_NAMES.length).toBeGreaterThan(0);
  });

  it('should include Local timezone', () => {
    expect(TIMEZONE_NAMES).toContain('Local');
  });

  it('should include common IANA timezones', () => {
    const commonZones = [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Australia/Sydney',
    ];

    for (const zone of commonZones) {
      expect(TIMEZONE_NAMES).toContain(zone);
    }
  });

  it('should have only string timezone names', () => {
    for (const tz of TIMEZONE_NAMES) {
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    }
  });

  it('should have no duplicate timezone names', () => {
    const uniqueZones = new Set(TIMEZONE_NAMES);
    expect(uniqueZones.size).toBe(TIMEZONE_NAMES.length);
  });
});
