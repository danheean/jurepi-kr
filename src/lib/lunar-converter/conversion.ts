import type { ConversionResult, ConversionError, DateRecord, LunarDateRecord } from './schema';
import { computeSexagenary } from './sexagenary';
import { computeZodiac } from './zodiac';

/**
 * Lunar engine interface: stateful wrapper around korean-lunar-calendar.
 * Must create a new instance per conversion (stateful library).
 */
export interface LunarEngine {
  setSolarDate(y: number, m: number, d: number): boolean;
  getLunarCalendar(): { year: number; month: number; day: number; intercalation: boolean };
  setLunarDate(y: number, m: number, d: number, intercalation: boolean): boolean;
  getSolarCalendar(): { year: number; month: number; day: number };
  getKoreanGapja(): { year: string; month: string; day: string; intercalation: string };
}

const TABLE_YEAR_MIN = 1391;
const TABLE_YEAR_MAX = 2050;

/**
 * Days in a given Gregorian month.
 * Simple helper for basic validation before calling the library.
 */
function daysInMonth(month: number, year: number): number {
  if (month < 1 || month > 12) return 0;
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return daysPerMonth[month - 1];
}

/**
 * Check if a year is a leap year (Gregorian calendar).
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Load the korean-lunar-calendar library.
 * Returns a fresh engine instance (stateful).
 */
async function loadEngine(): Promise<LunarEngine> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const KoreanLunarCalendar = require('korean-lunar-calendar');
  const instance = new KoreanLunarCalendar();

  return {
    setSolarDate: (y, m, d) => instance.setSolarDate(y, m, d),
    getLunarCalendar: () => instance.getLunarCalendar(),
    setLunarDate: (y, m, d, intercalation) => instance.setLunarDate(y, m, d, intercalation),
    getSolarCalendar: () => instance.getSolarCalendar(),
    getKoreanGapja: () => instance.getKoreanGapja(),
  };
}

/**
 * Convert a Gregorian (solar) date to a Korean lunar date.
 * Returns the conversion result with sexagenary and zodiac computed from the lunar year.
 * Returns an error if the year is out of range [1391, 2050] or the date is invalid.
 *
 * @param year Gregorian year
 * @param month Gregorian month (1-12)
 * @param day Gregorian day (1-31)
 * @param engine Optional custom engine for testing; defaults to loading the library
 */
export async function solarToLunar(
  year: number,
  month: number,
  day: number,
  engine?: LunarEngine
): Promise<ConversionResult | ConversionError> {
  const eng = engine || (await loadEngine());

  // Range validation: SPEC requires 1391–2050
  if (year < TABLE_YEAR_MIN || year > TABLE_YEAR_MAX) {
    return { error: 'out_of_range' };
  }

  // Basic date validation before calling the library
  if (month < 1 || month > 12) {
    return { error: 'invalid_date' };
  }

  const maxDay = daysInMonth(month, year);
  if (day < 1 || day > maxDay) {
    return { error: 'invalid_date' };
  }

  // Call the engine
  if (!eng.setSolarDate(year, month, day)) {
    return { error: 'invalid_date' };
  }

  // CRITICAL: only call getLunarCalendar() if setSolarDate returned true
  // The lib's stateful behavior means calling get*() after false returns stale/default data
  const lunar = eng.getLunarCalendar();

  // Compute sexagenary and zodiac from the lunar year
  const sex = computeSexagenary(lunar.year);
  const zod = computeZodiac(lunar.year);

  return {
    solarDate: { year, month, day },
    lunarDate: {
      year: lunar.year,
      month: lunar.month,
      day: lunar.day,
      isLeap: lunar.intercalation,
    },
    sexagenary: sex,
    zodiac: zod,
  };
}

/**
 * Convert a Korean lunar date to a Gregorian (solar) date.
 * Returns the conversion result with sexagenary and zodiac computed from the lunar year.
 * Returns an error if the year is out of range, the date is invalid, or the leap month does not exist.
 *
 * @param year Lunar year
 * @param month Lunar month (1-12)
 * @param day Lunar day (1-30)
 * @param isLeap Whether this is a leap month
 * @param engine Optional custom engine for testing; defaults to loading the library
 */
export async function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeap: boolean,
  engine?: LunarEngine
): Promise<ConversionResult | ConversionError> {
  const eng = engine || (await loadEngine());

  // Range validation: SPEC requires 1391–2050
  if (year < TABLE_YEAR_MIN || year > TABLE_YEAR_MAX) {
    return { error: 'out_of_range' };
  }

  // Basic date validation
  if (month < 1 || month > 12 || day < 1 || day > 30) {
    return { error: 'invalid_date' };
  }

  // Call the engine
  if (!eng.setLunarDate(year, month, day, isLeap)) {
    // If isLeap=true and false returned, likely "no leap month"
    return isLeap ? { error: 'no_leap_month' } : { error: 'invalid_date' };
  }

  // CRITICAL: only call getSolarCalendar() if setLunarDate returned true
  const solar = eng.getSolarCalendar();

  // Compute sexagenary and zodiac from the lunar year
  const sex = computeSexagenary(year);
  const zod = computeZodiac(year);

  return {
    solarDate: solar,
    lunarDate: { year, month, day, isLeap },
    sexagenary: sex,
    zodiac: zod,
  };
}
