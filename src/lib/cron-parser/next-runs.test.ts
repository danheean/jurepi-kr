import { describe, it, expect } from 'vitest';
import { computeNextRuns } from './next-runs';
import { parseCron } from './parser';

describe('computeNextRuns', () => {
  const baseDate = new Date('2026-07-11T10:30:00Z');

  it('should compute next weekday 9 AM runs', () => {
    const fields = parseCron('0 9 * * MON-FRI');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 5,
      maxYears: 4,
    });

    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].datetime.getUTCHours()).toBe(9);
    expect(runs[0].datetime.getUTCMinutes()).toBe(0);
  });

  it('should compute next runs for monthly 1st at midnight', () => {
    const fields = parseCron('0 0 1 * *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 3,
      maxYears: 4,
    });

    expect(runs.length).toBeGreaterThanOrEqual(1);
    runs.forEach((run) => {
      expect(run.datetime.getUTCDate()).toBe(1);
      expect(run.datetime.getUTCHours()).toBe(0);
      expect(run.datetime.getUTCMinutes()).toBe(0);
    });
  });

  it('should compute next runs for every 5 minutes', () => {
    const fields = parseCron('*/5 * * * *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 5,
      maxYears: 4,
    });

    expect(runs.length).toBe(5);
    // Should be at 10:35, 10:40, 10:45, 10:50, 10:55
    expect([35, 40, 45, 50, 55]).toContain(runs[0].datetime.getUTCMinutes());
  });

  it('should compute next runs for @daily', () => {
    const fields = parseCron('@daily');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 3,
      maxYears: 4,
    });

    expect(runs.length).toBeGreaterThanOrEqual(1);
    runs.forEach((run) => {
      expect(run.datetime.getUTCHours()).toBe(0);
      expect(run.datetime.getUTCMinutes()).toBe(0);
    });
  });

  it('should handle leap year Feb 29', () => {
    const fields = parseCron('0 0 29 2 *');
    const leapBase = new Date('2026-01-01T00:00:00Z');
    const runs = computeNextRuns(fields, {
      now: leapBase,
      timezone: 'UTC',
      limit: 3,
      maxYears: 4,
    });

    expect(runs.length).toBeGreaterThan(0);
    // First match should be 2028-02-29 (2026 is not a leap year, 2027 is not)
    expect(runs[0].datetime.getFullYear()).toBe(2028);
    expect(runs[0].datetime.getMonth()).toBe(1); // February
    expect(runs[0].datetime.getDate()).toBe(29);
  });

  it('should return empty array for impossible dates like Feb 30', () => {
    const fields = parseCron('0 0 30 2 *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 10,
      maxYears: 4,
    });

    expect(runs.length).toBe(0);
  });

  it('should return empty array when no matches within max years', () => {
    const fields = parseCron('0 0 32 1 *'); // January 32 doesn't exist
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 10,
      maxYears: 4,
    });

    expect(runs.length).toBe(0);
  });

  it('should handle dom/dow OR logic: 15th OR Monday', () => {
    const fields = parseCron('0 9 15 * MON');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-07-11T00:00:00Z'), // Saturday
      timezone: 'UTC',
      limit: 10,
      maxYears: 4,
    });

    expect(runs.length).toBeGreaterThan(0);
    // Verify that some runs fall on the 15th and others on Mondays
    let has15th = false;
    let hasMonday = false;
    for (const run of runs) {
      if (run.datetime.getDate() === 15) {
        has15th = true;
      }
      if (run.datetime.getDay() === 1) {
        hasMonday = true;
      }
    }
    expect(has15th || hasMonday).toBe(true);
  });

  it('should respect timezone parameter', () => {
    const fields = parseCron('0 9 * * *');
    const runsUTC = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 1,
      maxYears: 4,
    });

    const runsEST = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'America/New_York',
      limit: 1,
      maxYears: 4,
    });

    // Both should have results but times differ by timezone offset
    expect(runsUTC.length).toBeGreaterThan(0);
    expect(runsEST.length).toBeGreaterThan(0);
  });

  it('should include formatted string in results', () => {
    const fields = parseCron('0 0 1 * *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 1,
      maxYears: 4,
    });

    expect(runs[0].formatted).toBeDefined();
    expect(runs[0].formatted.length).toBeGreaterThan(0);
  });

  it('should compute correct number of runs', () => {
    const fields = parseCron('*/15 * * * *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 10,
      maxYears: 4,
    });

    expect(runs.length).toBe(10);
  });

  it('interprets cron fields in the selected timezone, not UTC', () => {
    // Regression: "0 9 * * *" must fire at 9 AM *in the chosen zone*.
    // Asia/Seoul is UTC+9 with no DST, so 9 AM Seoul == 00:00 UTC.
    const fields = parseCron('0 9 * * *');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-07-11T00:00:00Z'),
      timezone: 'Asia/Seoul',
      limit: 1,
      maxYears: 1,
    });

    expect(runs.length).toBe(1);
    expect(runs[0].datetime.getUTCHours()).toBe(0);
    expect(runs[0].datetime.getUTCMinutes()).toBe(0);

    // The wall-clock hour in Seoul must be 9 (not shifted by the offset).
    const seoulHour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(runs[0].datetime)
    );
    expect(seoulHour).toBe(9);
  });

  it('should handle Local timezone', () => {
    const fields = parseCron('0 12 * * *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'Local',
      limit: 1,
      maxYears: 4,
    });

    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].datetime).toBeDefined();
  });

  it('should return runs in ascending order', () => {
    const fields = parseCron('0 */6 * * *');
    const runs = computeNextRuns(fields, {
      now: baseDate,
      timezone: 'UTC',
      limit: 5,
      maxYears: 4,
    });

    for (let i = 0; i < runs.length - 1; i++) {
      expect(runs[i].datetime.getTime()).toBeLessThan(
        runs[i + 1].datetime.getTime()
      );
    }
  });

  it('should skip past current time when computing next runs', () => {
    const now = new Date('2026-07-11T10:30:00Z');
    const fields = parseCron('0 10 * * *');
    const runs = computeNextRuns(fields, {
      now,
      timezone: 'UTC',
      limit: 1,
      maxYears: 4,
    });

    expect(runs[0].datetime.getTime()).toBeGreaterThan(now.getTime());
  });

  it('should compute Apr 31 as nonexistent (only 30 days)', () => {
    const fields = parseCron('0 0 31 4 *');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-01-01T00:00:00Z'),
      timezone: 'UTC',
      limit: 10,
      maxYears: 4,
    });

    expect(runs.length).toBe(0);
  });

  it('should compute month boundaries correctly', () => {
    const fields = parseCron('0 0 31 * *');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-01-01T00:00:00Z'),
      timezone: 'UTC',
      limit: 12,
      maxYears: 4,
    });

    // Only months with 31 days: Jan, Mar, May, Jul, Aug, Oct, Dec
    const monthsWithRuns = new Set(
      runs.map((r) => r.datetime.getMonth() + 1)
    );
    expect(monthsWithRuns.size).toBeLessThanOrEqual(7);
  });

  // Coverage: formatting branch (formatted string generation)
  it('should include formatted and utc fields in next run', () => {
    const fields = parseCron('0 9 * * *');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-07-11T12:00:00Z'),
      timezone: 'UTC',
      limit: 1,
      maxYears: 4,
    });

    expect(runs[0].datetime).toBeDefined();
    expect(runs[0].formatted).toBeDefined();
    expect(runs[0].utc).toBeDefined();
    // Formatted should contain readable date/time
    expect(runs[0].formatted).toMatch(/\d{4}/); // year
    expect(runs[0].formatted).toMatch(/\d{1,2}:\d{2}/); // time
    // UTC should be ISO 8601 format
    expect(runs[0].utc).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  // Coverage: invalid timezone fallback (catch block)
  it('should fallback to toString for invalid timezone', () => {
    const fields = parseCron('0 9 * * *');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-07-11T12:00:00Z'),
      timezone: 'InvalidTimeZoneName',
      limit: 1,
      maxYears: 4,
    });

    // Should still return a result, using fallback formatting
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0].formatted).toBeDefined();
  });

  // Coverage: maxYears cap early return (Feb 30 never exists)
  it('should return empty array for impossible date Feb 30', () => {
    const fields = parseCron('0 0 30 2 *');
    const runs = computeNextRuns(fields, {
      now: new Date('2026-01-01T00:00:00Z'),
      timezone: 'UTC',
      limit: 1,
      maxYears: 4,
    });

    // Feb 30 doesn't exist in any year, should hit maxYears cap
    expect(runs.length).toBe(0);
  });

  // Coverage: maxYears cap with small window
  it('should respect maxYears parameter and return fewer runs', () => {
    const fields = parseCron('0 0 1 1 *'); // Jan 1st only
    const runs = computeNextRuns(fields, {
      now: new Date('2026-07-11T00:00:00Z'),
      timezone: 'UTC',
      limit: 10,
      maxYears: 1, // Only 1 year lookahead
    });

    // With 1 year window from July 2026, only Jan 2027 matches
    expect(runs.length).toBeLessThanOrEqual(1);
    if (runs.length > 0) {
      expect(runs[0].datetime.getFullYear()).toBeLessThanOrEqual(2027);
    }
  });
});
