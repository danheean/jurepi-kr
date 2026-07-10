import { describe, it, expect } from 'vitest';
import { describeQuartz } from './quartz-description';
import { parseQuartz } from './quartz-parser';

describe('describeQuartz', () => {
  describe('frequency detection', () => {
    it('detects every second', () => {
      const fields = parseQuartz('* * * * * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('everySecond');
      expect(desc.atTimes).toBeUndefined();
    });

    it('detects every N seconds', () => {
      const fields = parseQuartz('0,30 * * * * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('everyNSeconds');
    });

    it('detects every minute', () => {
      const fields = parseQuartz('0 * * * * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('everyMinute');
    });

    it('detects every N minutes', () => {
      const fields = parseQuartz('0 0,15,30,45 * * * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('everyNMinutes');
    });

    it('detects every hour', () => {
      const fields = parseQuartz('0 0 * * * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('everyHour');
    });

    it('detects every day', () => {
      const fields = parseQuartz('0 0 0 * * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('everyDay');
    });

    it('detects custom frequency', () => {
      const fields = parseQuartz('0 0 9 ? * MON-FRI');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('custom');
    });
  });

  describe('time specification', () => {
    it('captures specific times', () => {
      const fields = parseQuartz('0 0,30 9 * * ?');
      const desc = describeQuartz(fields);
      expect(desc.atTimes).toEqual([
        { hour: 9, minute: 0, second: 0 },
        { hour: 9, minute: 30, second: 0 },
      ]);
    });

    it('captures times with multiple hours', () => {
      const fields = parseQuartz('0 0 9,17 * * ?');
      const desc = describeQuartz(fields);
      expect(desc.atTimes?.length).toBe(2);
      expect(desc.atTimes).toContainEqual({ hour: 9, minute: 0, second: 0 });
      expect(desc.atTimes).toContainEqual({ hour: 17, minute: 0, second: 0 });
    });
  });

  describe('dom specification', () => {
    it('detects specific dates', () => {
      const fields = parseQuartz('0 0 0 1,15 * ?');
      const desc = describeQuartz(fields);
      expect(desc.domKind).toBe('specific');
      expect(desc.domDetail?.dates).toEqual([1, 15]);
    });

    it('detects last day', () => {
      const fields = parseQuartz('0 0 0 L * ?');
      const desc = describeQuartz(fields);
      expect(desc.domKind).toBe('lastDay');
      expect(desc.domDetail?.dates).toBeUndefined();
    });

    it('detects last day with offset', () => {
      const fields = parseQuartz('0 0 0 L-3 * ?');
      const desc = describeQuartz(fields);
      expect(desc.domKind).toBe('lastOffset');
      expect(desc.domDetail?.offset).toBe(3);
    });

    it('detects last weekday', () => {
      const fields = parseQuartz('0 0 0 LW * ?');
      const desc = describeQuartz(fields);
      expect(desc.domKind).toBe('lastWeekday');
    });

    it('detects nearest weekday', () => {
      const fields = parseQuartz('0 0 0 15W * ?');
      const desc = describeQuartz(fields);
      expect(desc.domKind).toBe('nearestWeekday');
      expect(desc.domDetail?.nearest).toBe(15);
    });

    it('detects no specific dom', () => {
      const fields = parseQuartz('0 0 0 ? * MON');
      const desc = describeQuartz(fields);
      expect(desc.domKind).toBe('noSpecific');
    });
  });

  describe('dow specification', () => {
    it('detects specific days', () => {
      const fields = parseQuartz('0 0 0 ? * MON,WED,FRI');
      const desc = describeQuartz(fields);
      expect(desc.dowKind).toBe('specific');
      expect(desc.dowDetail?.days).toEqual(['MON', 'WED', 'FRI']);
    });

    it('detects last occurrence of day', () => {
      const fields = parseQuartz('0 0 0 ? * 6L');
      const desc = describeQuartz(fields);
      expect(desc.dowKind).toBe('last');
      expect(desc.dowDetail?.last).toBe('FRI');
    });

    it('detects nth occurrence of day', () => {
      const fields = parseQuartz('0 0 0 ? * 6#3');
      const desc = describeQuartz(fields);
      expect(desc.dowKind).toBe('nth');
      expect(desc.dowDetail?.nth).toEqual({ day: 'FRI', n: 3 });
    });

    it('detects no specific dow', () => {
      const fields = parseQuartz('0 0 0 15 * ?');
      const desc = describeQuartz(fields);
      expect(desc.dowKind).toBe('noSpecific');
    });
  });

  describe('month specification', () => {
    it('detects all months', () => {
      const fields = parseQuartz('0 0 0 1 * ?');
      const desc = describeQuartz(fields);
      expect(desc.onMonths).toBeUndefined();
    });

    it('detects specific months', () => {
      const fields = parseQuartz('0 0 0 1 1,6,12 ?');
      const desc = describeQuartz(fields);
      expect(desc.onMonths).toEqual(['JAN', 'JUN', 'DEC']);
    });
  });

  describe('year specification', () => {
    it('includes years when specified', () => {
      const fields = parseQuartz('0 0 0 1 1 ? 2026,2027');
      const desc = describeQuartz(fields);
      expect(desc.years).toEqual([2026, 2027]);
    });

    it('excludes years when not specified', () => {
      const fields = parseQuartz('0 0 0 1 1 ?');
      const desc = describeQuartz(fields);
      expect(desc.years).toBeUndefined();
    });
  });

  describe('complex expressions', () => {
    it('describes weekday 9am', () => {
      const fields = parseQuartz('0 0 9 ? * MON-FRI');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('custom');
      expect(desc.atTimes).toContainEqual({ hour: 9, minute: 0, second: 0 });
      expect(desc.dowKind).toBe('specific');
      expect(desc.dowDetail?.days).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI']);
    });

    it('describes monthly last day', () => {
      const fields = parseQuartz('0 0 0 L * ?');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('custom');
      expect(desc.domKind).toBe('lastDay');
    });

    it('describes 3rd Friday at 9am', () => {
      const fields = parseQuartz('0 0 9 ? * 6#3');
      const desc = describeQuartz(fields);
      expect(desc.frequencyKind).toBe('custom');
      expect(desc.atTimes).toContainEqual({ hour: 9, minute: 0, second: 0 });
      expect(desc.dowKind).toBe('nth');
      expect(desc.dowDetail?.nth?.day).toBe('FRI');
      expect(desc.dowDetail?.nth?.n).toBe(3);
    });
  });
});
