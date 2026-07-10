import { lunarToSolar, solarToLunar } from '@/lib/lunar-converter/conversion';
import type { LunarEngine } from '@/lib/lunar-converter/conversion';
import type { DateKey } from './date';

export type CalendarType = 'solar' | 'lunar';

export interface ResolvedBirthdate {
  /** Canonical solar date (YYYY-MM-DD) used for all age/day/star calculations. */
  solarDate: DateKey;
  /** Lunar counterpart of the same birthdate (echoes the input when entered as lunar). */
  lunarDate: { date: DateKey; isLeapMonth: boolean };
  /** Accurate Korean zodiac key, derived from the LUNAR year (rat..pig). */
  zodiacKey: string;
  /** Sexagenary (60갑자): { name: "을유", hanja: "乙酉", english: "Wood Rooster" }. */
  sexagenary: { name: string; hanja: string; english: string };
}

export type ResolveError = { error: 'range' | 'no-leap' | 'invalid' };

export function isResolveError(r: ResolvedBirthdate | ResolveError): r is ResolveError {
  return 'error' in r;
}

const pad = (n: number): string => String(n).padStart(2, '0');

/**
 * Resolve an entered birthdate (solar OR lunar) to a canonical solar date plus
 * the accurate zodiac / sexagenary. Reuses the lunar-converter engine (the same
 * KASI-backed `korean-lunar-calendar` used by the 음력 변환기 tool) so the
 * Korean zodiac is computed from the LUNAR year — correct even for people born
 * near the lunar new year, and for lunar-entered birthdays.
 *
 * @param engine optional injected engine (tests); production loads the library.
 */
export async function resolveBirthdate(
  date: DateKey,
  calendarType: CalendarType,
  isLeapMonth: boolean,
  engine?: LunarEngine
): Promise<ResolvedBirthdate | ResolveError> {
  const [y, m, d] = date.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return { error: 'invalid' };
  }

  const result =
    calendarType === 'lunar'
      ? await lunarToSolar(y, m, d, isLeapMonth, engine)
      : await solarToLunar(y, m, d, engine);

  if ('error' in result) {
    if (result.error === 'no_leap_month') return { error: 'no-leap' };
    if (result.error === 'out_of_range') return { error: 'range' };
    return { error: 'invalid' };
  }

  const s = result.solarDate;
  const l = result.lunarDate;
  return {
    solarDate: `${s.year}-${pad(s.month)}-${pad(s.day)}` as DateKey,
    lunarDate: {
      date: `${l.year}-${pad(l.month)}-${pad(l.day)}` as DateKey,
      isLeapMonth: l.isLeap,
    },
    zodiacKey: result.zodiac.key,
    sexagenary: { name: result.sexagenary.name, hanja: result.sexagenary.hanja, english: result.sexagenary.english },
  };
}
