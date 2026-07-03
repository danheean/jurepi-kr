import { describe, it, expect } from 'vitest';
import { resolveBirthdate, isResolveError } from './resolve';
import { solarToLunar } from '@/lib/lunar-converter/conversion';
import type { LunarEngine } from '@/lib/lunar-converter/conversion';

describe('resolveBirthdate', () => {
  it('resolves a solar date to itself with the lunar-year zodiac', async () => {
    // Solar 2000-03-15 is after the 2000 lunar new year → lunar year 2000 → dragon.
    const r = await resolveBirthdate('2000-03-15', 'solar', false);
    expect(isResolveError(r)).toBe(false);
    if (isResolveError(r)) return;
    expect(r.solarDate).toBe('2000-03-15');
    expect(r.zodiacKey).toBe('dragon');
    expect(r.sexagenary.hanja).toMatch(/[一-鿿]{2}/); // two Hanja
  });

  it('fixes the zodiac for a solar date BEFORE the lunar new year (accuracy)', async () => {
    // Solar 2000-01-15 is BEFORE the 2000 lunar new year (Feb 5) → lunar year 1999
    // → rabbit. The old solar-year heuristic ((2000-1900)%12) wrongly gave dragon.
    const r = await resolveBirthdate('2000-01-15', 'solar', false);
    expect(isResolveError(r)).toBe(false);
    if (isResolveError(r)) return;
    expect(r.zodiacKey).toBe('rabbit');
  });

  it('round-trips a lunar date back to the original solar date', async () => {
    const lunar = await solarToLunar(2000, 3, 15);
    if ('error' in lunar) throw new Error('setup conversion failed');
    const { year, month, day, isLeap } = lunar.lunarDate;
    const pad = (n: number) => String(n).padStart(2, '0');
    const r = await resolveBirthdate(`${year}-${pad(month)}-${pad(day)}`, 'lunar', isLeap);
    expect(isResolveError(r)).toBe(false);
    if (isResolveError(r)) return;
    expect(r.solarDate).toBe('2000-03-15');
    expect(r.zodiacKey).toBe('dragon'); // lunar year 2000
  });

  it('exposes the lunar counterpart for a SOLAR-entered birthdate', async () => {
    // Solar 2000-03-15 → lunar 2000-02-10 (verify against the conversion lib itself).
    const expected = await solarToLunar(2000, 3, 15);
    if ('error' in expected) throw new Error('setup conversion failed');
    const pad = (n: number) => String(n).padStart(2, '0');
    const expectedKey = `${expected.lunarDate.year}-${pad(expected.lunarDate.month)}-${pad(expected.lunarDate.day)}`;

    const r = await resolveBirthdate('2000-03-15', 'solar', false);
    expect(isResolveError(r)).toBe(false);
    if (isResolveError(r)) return;
    expect(r.lunarDate.date).toBe(expectedKey);
    expect(r.lunarDate.isLeapMonth).toBe(expected.lunarDate.isLeap);
  });

  it('exposes the lunar date (echo) for a LUNAR-entered birthdate, preserving leap flag', async () => {
    // 2023 has a leap 2nd month: lunar 2023-02-15(leap) → solar 2023-04-05.
    const r = await resolveBirthdate('2023-02-15', 'lunar', true);
    expect(isResolveError(r)).toBe(false);
    if (isResolveError(r)) return;
    expect(r.solarDate).toBe('2023-04-05');
    expect(r.lunarDate.date).toBe('2023-02-15');
    expect(r.lunarDate.isLeapMonth).toBe(true);
  });

  it('returns range error for a year outside 1901–2050', async () => {
    const r = await resolveBirthdate('1850-01-01', 'solar', false);
    expect(r).toEqual({ error: 'range' });
  });

  it('returns invalid error for an impossible month', async () => {
    const r = await resolveBirthdate('2000-13-01', 'solar', false);
    expect(r).toEqual({ error: 'invalid' });
  });

  it('returns no-leap error when a leap month does not exist that year', async () => {
    // Inject an engine that rejects the leap-month lunar date.
    const noLeapEngine: LunarEngine = {
      setSolarDate: () => true,
      getLunarCalendar: () => ({ year: 2000, month: 5, day: 1, intercalation: false }),
      setLunarDate: () => false, // simulate "no leap month this year"
      getSolarCalendar: () => ({ year: 2000, month: 6, day: 1 }),
      getKoreanGapja: () => ({ year: '', month: '', day: '', intercalation: '' }),
    };
    const r = await resolveBirthdate('2000-05-01', 'lunar', true, noLeapEngine);
    expect(r).toEqual({ error: 'no-leap' });
  });
});
