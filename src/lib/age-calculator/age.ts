import { koreanZodiac, starSign } from './zodiac';

export interface AgeResult {
  manNai: number;
  yeonNai: number;
  seeneunNai: number;
  dayOfWeek: number;
  daysLived: number;
  breakdown: { years: number; months: number; days: number };
  nextBirthdayCountdown: number;
  zodiacKey: string;
  starSignKey: string;
  /** Sexagenary (60갑자), set when the birthdate has been resolved via the lunar
   *  engine (name = "을유", hanja = "乙酉"). Null until resolved / on solar-only fallback. */
  sexagenary?: { name: string; hanja: string; english: string } | null;
  /** The SAME birthdate expressed in the other calendar (entered solar → lunar
   *  counterpart, entered lunar → solar counterpart). Set by the resolve step. */
  counterpartBirthday?: {
    calendar: 'solar' | 'lunar';
    date: string; // YYYY-MM-DD
    isLeapMonth?: boolean; // only meaningful when calendar === 'lunar'
  } | null;
}

/**
 * manNai: Legal age (Korea 2023+).
 * Returns exact years since birth (has birthday passed this year?).
 */
export function manNai(birthDate: Date, asOfDate: Date): number {
  let age = asOfDate.getFullYear() - birthDate.getFullYear();

  // Check if birthday has passed this year
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();
  const currentMonth = asOfDate.getMonth();
  const currentDay = asOfDate.getDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age;
}

/**
 * yeonNai: Calendar year based age.
 * Simply current year - birth year (doesn't care about actual birthday).
 */
export function yeonNai(birthYear: number, asOfYear: number): number {
  return asOfYear - birthYear;
}

/**
 * seeneunNai: Traditional Korean counting age.
 * Birth year counts as 1; increments on every Jan 1.
 */
export function seeneunNai(birthYear: number, asOfYear: number): number {
  return asOfYear - birthYear + 1;
}

/**
 * dayOfWeek: Return day of week (0-6, 0=Sunday).
 */
export function dayOfWeek(d: Date): number {
  return d.getDay();
}

/**
 * daysLived: Total days since birth (not including birth day itself).
 */
export function daysLived(birthDate: Date, asOfDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((asOfDate.getTime() - birthDate.getTime()) / msPerDay);
}

/**
 * breakdown: Exact age in years, months, days.
 */
export function breakdown(
  birthDate: Date,
  asOfDate: Date
): { years: number; months: number; days: number } {
  let years = manNai(birthDate, asOfDate);
  let months = 0;
  let days = 0;

  // Create anniversary date for this year
  let anniversary = new Date(asOfDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  // If anniversary hasn't occurred yet, use last year's anniversary
  if (anniversary > asOfDate) {
    years--;
    anniversary = new Date(asOfDate.getFullYear() - 1, birthDate.getMonth(), birthDate.getDate());
  }

  // Count months from anniversary to asOfDate
  let current = new Date(anniversary);
  while (true) {
    const next = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
    if (next > asOfDate) {
      break;
    }
    months++;
    current = next;
  }

  // Count remaining days
  const nextDay = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  days = Math.floor((asOfDate.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

  return { years, months, days };
}

/**
 * nextBirthdayCountdown: Days until next birthday (1-366).
 */
export function nextBirthdayCountdown(birthDate: Date, asOfDate: Date): number {
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  // Try this year's anniversary
  let nextAnniversary = new Date(asOfDate.getFullYear(), birthMonth, birthDay);

  // If already passed, use next year's
  if (nextAnniversary <= asOfDate) {
    nextAnniversary = new Date(asOfDate.getFullYear() + 1, birthMonth, birthDay);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const countDown = Math.ceil((nextAnniversary.getTime() - asOfDate.getTime()) / msPerDay);

  // Ensure countdown is in valid range [1, 366]
  return Math.max(1, Math.min(366, countDown));
}

/**
 * calculateAge: Comprehensive age result including all calculations and zodiac/star sign.
 */
export function calculateAge(birthDate: Date, asOfDate: Date): AgeResult {
  return {
    manNai: manNai(birthDate, asOfDate),
    yeonNai: yeonNai(birthDate.getFullYear(), asOfDate.getFullYear()),
    seeneunNai: seeneunNai(birthDate.getFullYear(), asOfDate.getFullYear()),
    dayOfWeek: dayOfWeek(birthDate),
    daysLived: daysLived(birthDate, asOfDate),
    breakdown: breakdown(birthDate, asOfDate),
    nextBirthdayCountdown: nextBirthdayCountdown(birthDate, asOfDate),
    zodiacKey: koreanZodiac(birthDate.getFullYear()),
    starSignKey: starSign(birthDate.getMonth() + 1, birthDate.getDate()),
  };
}
