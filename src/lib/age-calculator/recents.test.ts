import { describe, it, expect } from 'vitest';
import {
  pushRecent,
  pruneUnknown,
  serializeRecents,
  deserializeRecents,
  type RecentEntry,
} from './recents';

/** Solar entry helper. */
const S = (date: string): RecentEntry => ({ date, calendarType: 'solar', isLeapMonth: false });
/** Lunar entry helper. */
const L = (date: string, leap = false): RecentEntry => ({ date, calendarType: 'lunar', isLeapMonth: leap });

describe('age-calculator/recents', () => {
  describe('pushRecent', () => {
    it('adds a recent to the front of the list', () => {
      expect(pushRecent([], S('2000-03-15'))).toEqual([S('2000-03-15')]);
    });

    it('deduplicates by (calendarType, date, leap): moves existing to front', () => {
      const list = [S('2000-01-01'), S('1990-06-15'), S('2005-12-25')];
      const result = pushRecent(list, S('1990-06-15'));
      expect(result[0]).toEqual(S('1990-06-15'));
      expect(result).toHaveLength(3);
    });

    it('treats solar and lunar of the same date as distinct entries', () => {
      const result = pushRecent([S('1990-01-01')], L('1990-01-01'));
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(L('1990-01-01'));
    });

    it('distinguishes leap vs non-leap lunar entries', () => {
      const result = pushRecent([L('2000-05-01', false)], L('2000-05-01', true));
      expect(result).toHaveLength(2);
    });

    it('truncates to max length (default 10)', () => {
      let list: RecentEntry[] = [];
      for (let i = 1; i <= 15; i++) list = pushRecent(list, S(`2000-${String(i).padStart(2, '0')}-15`));
      expect(list).toHaveLength(10);
    });

    it('returns a new array instance', () => {
      const list = [S('2000-01-01')];
      expect(pushRecent(list, S('1990-06-15'))).not.toBe(list);
    });
  });

  describe('pruneUnknown', () => {
    it('keeps valid object entries', () => {
      expect(pruneUnknown([S('2000-03-15'), L('1990-06-15', true)])).toEqual([
        S('2000-03-15'),
        L('1990-06-15', true),
      ]);
    });

    it('migrates legacy bare DateKey strings to solar entries', () => {
      expect(pruneUnknown(['2000-03-15', '1990-06-15'])).toEqual([S('2000-03-15'), S('1990-06-15')]);
    });

    it('drops malformed dates and junk', () => {
      const list: unknown[] = ['2000-03-15', '2000/03/15', '2000-13-01', 123, null, { date: 'x' }];
      expect(pruneUnknown(list)).toEqual([S('2000-03-15')]);
    });

    it('coerces unknown calendarType to solar and missing leap to false', () => {
      expect(pruneUnknown([{ date: '2000-03-15', calendarType: 'weird' }])).toEqual([S('2000-03-15')]);
    });

    it('returns empty array for non-array input', () => {
      expect(pruneUnknown(null as any)).toEqual([]);
      expect(pruneUnknown('nope' as any)).toEqual([]);
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips object entries', () => {
      const original = [S('2000-03-15'), L('1990-06-15', true)];
      expect(deserializeRecents(serializeRecents(original))).toEqual(original);
    });

    it('deserializes legacy string arrays as solar entries', () => {
      expect(deserializeRecents('["2000-03-15","1990-06-15"]')).toEqual([S('2000-03-15'), S('1990-06-15')]);
    });

    it('never throws on garbage', () => {
      ['not json', '', '{ broken', '"str"', '123', '{"a":1}'].forEach((input) => {
        expect(() => deserializeRecents(input)).not.toThrow();
        expect(deserializeRecents(input)).toEqual([]);
      });
    });
  });
});
