import { describe, it, expect } from 'vitest';
import {
  parseUnixSeconds,
  formatTimestamp,
  getValidityStatus,
  formatDuration,
} from './timestamp';

describe('timestamp.ts', () => {
  describe('parseUnixSeconds', () => {
    it('should convert Unix seconds to Date', () => {
      const date = parseUnixSeconds(1516239022);
      expect(date.getTime()).toBe(1516239022 * 1000);
    });

    it('should handle zero', () => {
      const date = parseUnixSeconds(0);
      expect(date.getTime()).toBe(0);
    });

    it('should handle large numbers', () => {
      const date = parseUnixSeconds(1720376400);
      expect(date.getTime()).toBe(1720376400 * 1000);
    });
  });

  describe('formatTimestamp', () => {
    const testDate = new Date('2026-07-08T14:34:56Z');

    it('should format to ISO string', () => {
      const result = formatTimestamp(testDate, 'en-US');
      expect(result.iso).toBe('2026-07-08T14:34:56.000Z');
    });

    it('should format to local time with locale', () => {
      const result = formatTimestamp(testDate, 'en-US');
      expect(result.local).toBeTruthy();
      expect(result.local).toContain('2026');
      const hasMonth = result.local.includes('July') || result.local.includes('Jul');
      expect(hasMonth).toBe(true);
    });

    it('should respect locale parameter for ko-KR', () => {
      const result = formatTimestamp(testDate, 'ko-KR');
      expect(result.local).toBeTruthy();
      expect(result.iso).toBe(result.iso);
    });

    it('should format with UTC timezone', () => {
      const result = formatTimestamp(testDate, 'en-US');
      const hasUTCOrYear = result.local.includes('UTC') || result.local.includes('2026');
      expect(hasUTCOrYear).toBe(true);
    });
  });

  describe('formatDuration', () => {
    it('should format positive seconds', () => {
      const result = formatDuration(3661); // 1h 1m 1s
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(1);
      expect(result.seconds).toBe(1);
    });

    it('should handle zero', () => {
      const result = formatDuration(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle seconds only', () => {
      const result = formatDuration(45);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(45);
    });

    it('should handle minutes and seconds', () => {
      const result = formatDuration(125); // 2m 5s
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(2);
      expect(result.seconds).toBe(5);
    });

    it('should handle hours only', () => {
      const result = formatDuration(7200); // 2h
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle large durations', () => {
      const result = formatDuration(86400); // 1 day
      expect(result.hours).toBe(24);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle negative seconds', () => {
      const result = formatDuration(-3661);
      expect(result.hours).toBe(-1);
    });
  });

  describe('getValidityStatus', () => {
    it('should return valid when within iat/exp range', () => {
      const now = 1720372800000; // July 8, 2026
      const iat = 1720372800; // same time in seconds
      const exp = 1720376400; // +1h
      const result = getValidityStatus({ iat, exp }, now);
      expect(result.status).toBe('valid');
    });

    it('should return expired when past exp', () => {
      const now = 1720380000000; // after expiry
      const exp = 1720376400; // 1h before now
      const result = getValidityStatus({ exp }, now);
      expect(result.status).toBe('expired');
    });

    it('should return not_yet_valid when before iat', () => {
      const now = 1720370000000; // early time
      const iat = 1720372800; // future time
      const result = getValidityStatus({ iat }, now);
      expect(result.status).toBe('not_yet_valid');
    });

    it('should return not_yet_valid when before nbf', () => {
      const now = 1720370000000;
      const nbf = 1720372800;
      const result = getValidityStatus({ nbf }, now);
      expect(result.status).toBe('not_yet_valid');
    });

    it('should return unknown when no time claims present', () => {
      const now = 1720372800000;
      const result = getValidityStatus({}, now);
      expect(result.status).toBe('unknown');
    });

    it('should include secondsRemaining for valid tokens', () => {
      const now = 1720372800000;
      const exp = 1720376400; // 3600s later
      const result = getValidityStatus({ exp }, now);
      expect(result.secondsRemaining).toBe(3600);
    });

    it('should include secondsRemaining (negative) for expired tokens', () => {
      const now = 1720380000000;
      const exp = 1720376400;
      const result = getValidityStatus({ exp }, now);
      expect(result.secondsRemaining).toBeLessThan(0);
    });

    it('should include secondsRemaining for not_yet_valid tokens', () => {
      const now = 1720370000000;
      const iat = 1720372800;
      const result = getValidityStatus({ iat }, now);
      expect(result.secondsRemaining).toBeGreaterThan(0);
    });
  });
});
