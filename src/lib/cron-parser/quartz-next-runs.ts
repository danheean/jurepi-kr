import { QuartzFields } from './quartz-schema';
import { NEXT_RUNS_LIMIT, MAX_LOOKAHEAD_YEARS } from './constants';
import { NextRun } from './schema';

export interface NextRunOptions {
  now: Date;
  timezone: string;
  limit?: number;
  maxYears?: number;
}

export function computeNextRunsQuartz(fields: QuartzFields, options: NextRunOptions): NextRun[] {
  const {
    now,
    timezone,
    limit = NEXT_RUNS_LIMIT,
    maxYears = MAX_LOOKAHEAD_YEARS,
  } = options;

  if (!fields.isValid) {
    return [];
  }

  const runs: NextRun[] = [];
  const maxDate = new Date(now.getTime());
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);

  // Start from the next minute (UTC-aligned)
  const current = new Date(now.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  const zone = timezone === 'Local' ? undefined : timezone;
  let offsetMinutes = zoneOffsetMinutes(current, zone);
  let offsetHourKey = Math.floor(current.getTime() / 3_600_000);

  let iterations = 0;
  const maxIterations = 4320000; // ~3 years of minutes

  while (
    runs.length < limit &&
    current.getTime() < maxDate.getTime() &&
    iterations < maxIterations
  ) {
    iterations++;

    // Refresh zone offset at UTC hour boundaries (DST-safe)
    const hourKey = Math.floor(current.getTime() / 3_600_000);
    if (hourKey !== offsetHourKey) {
      offsetMinutes = zoneOffsetMinutes(current, zone);
      offsetHourKey = hourKey;
    }

    // Convert to wall-clock time in target zone
    const local = new Date(current.getTime() + offsetMinutes * 60000);
    const year = local.getUTCFullYear();
    const month = local.getUTCMonth() + 1; // 1-12
    const date = local.getUTCDate();
    const day = local.getUTCDay(); // 0-6
    const hours = local.getUTCHours();
    const minutes = local.getUTCMinutes();

    // Check basic field constraints
    if (
      !fields.month.includes(month) ||
      !fields.hour.includes(hours) ||
      !fields.minute.includes(minutes) ||
      (fields.year && !fields.year.includes(year))
    ) {
      current.setUTCMinutes(current.getUTCMinutes() + 1);
      continue;
    }

    // Check dom/dow constraint
    if (!matchesDomOrDow(fields, year, month, date, day)) {
      current.setUTCMinutes(current.getUTCMinutes() + 1);
      continue;
    }

    // Minute matches; expand to all matching seconds
    for (const sec of fields.second) {
      const matchingTime = new Date(current.getTime());
      matchingTime.setUTCSeconds(sec, 0);
      runs.push({
        datetime: new Date(matchingTime),
        formatted: formatDateTime(matchingTime, timezone),
        utc: matchingTime.toISOString(),
      });

      if (runs.length >= limit) {
        break;
      }
    }

    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  return runs.slice(0, limit);
}

function matchesDomOrDow(fields: QuartzFields, year: number, month: number, date: number, day: number): boolean {
  const domUnspecified = fields.dom.noSpecific;
  const dowUnspecified = fields.dow.noSpecific;

  if (domUnspecified && dowUnspecified) {
    // Both unspecified: should not happen with proper parsing, but allow
    return true;
  }

  if (domUnspecified) {
    // Only dow specified
    return matchesDow(fields, year, month, date, day);
  }

  if (dowUnspecified) {
    // Only dom specified
    return matchesDom(fields, year, month, date);
  }

  // Both specified: OR logic (Quartz allows dom OR dow)
  return matchesDom(fields, year, month, date) || matchesDow(fields, year, month, date, day);
}

function matchesDom(fields: QuartzFields, year: number, month: number, date: number): boolean {
  // Check explicit values
  if (fields.dom.values.includes(date)) {
    return true;
  }

  // Check L-k (last day minus offset) - must come before L check
  if (fields.dom.lastOffset) {
    const lastDay = daysInMonth(year, month);
    if (date === lastDay - fields.dom.lastOffset) {
      return true;
    }
  }

  // Check L (last day) - only if no offset
  if (fields.dom.lastDay && !fields.dom.lastOffset && date === daysInMonth(year, month)) {
    return true;
  }

  // Check LW (last weekday)
  if (fields.dom.lastWeekday) {
    const lastDay = daysInMonth(year, month);
    const lastDate = new Date(Date.UTC(year, month - 1, lastDay));
    const lastDow = lastDate.getUTCDay();

    // Find last weekday
    let nearestDate = lastDay;
    if (lastDow === 6) {
      // Saturday -> move to Friday
      nearestDate = lastDay - 1;
    } else if (lastDow === 0) {
      // Sunday -> move to Friday
      nearestDate = lastDay - 2;
    }

    if (date === nearestDate) {
      return true;
    }
  }

  // Check nW (nearest weekday)
  if (fields.dom.nearestWeekday !== undefined) {
    const targetDate = new Date(Date.UTC(year, month - 1, fields.dom.nearestWeekday));
    const targetDow = targetDate.getUTCDay();
    const daysInM = daysInMonth(year, month);

    let nearestDate = fields.dom.nearestWeekday;
    if (targetDow === 6) {
      // Saturday -> move to Friday (or Monday if Sat is last day)
      if (fields.dom.nearestWeekday > 1) {
        nearestDate = fields.dom.nearestWeekday - 1;
      } else {
        nearestDate = fields.dom.nearestWeekday + 2;
      }
    } else if (targetDow === 0) {
      // Sunday -> move to Monday (or Friday if Sun is first day)
      if (fields.dom.nearestWeekday < daysInM) {
        nearestDate = fields.dom.nearestWeekday + 1;
      } else {
        nearestDate = fields.dom.nearestWeekday - 2;
      }
    }

    if (date === nearestDate) {
      return true;
    }
  }

  return false;
}

function matchesDow(fields: QuartzFields, year: number, month: number, date: number, day: number): boolean {
  // Check explicit values
  if (fields.dow.values.includes(day)) {
    return true;
  }

  // Check dowL (last occurrence)
  if (fields.dow.last !== undefined) {
    if (isLastOccurrence(year, month, date, fields.dow.last, day)) {
      return true;
    }
  }

  // Check dow#n (nth occurrence)
  if (fields.dow.nth) {
    if (isNthOccurrence(year, month, date, day, fields.dow.nth.dow, fields.dow.nth.n)) {
      return true;
    }
  }

  return false;
}

function isLastOccurrence(year: number, month: number, date: number, targetDow: number, actualDow: number): boolean {
  // Only match if actual dow matches target dow
  if (actualDow !== targetDow) {
    return false;
  }

  // Check if this is the last occurrence of this dow in this month
  const nextWeekDate = date + 7;
  if (nextWeekDate > daysInMonth(year, month)) {
    return true;
  }

  return false;
}

function isNthOccurrence(
  year: number,
  month: number,
  date: number,
  actualDow: number,
  targetDow: number,
  n: number
): boolean {
  // Only match if actual dow matches target dow
  if (actualDow !== targetDow) {
    return false;
  }

  // Count occurrences of this dow up to and including this date
  let count = 0;
  for (let d = 1; d <= date; d++) {
    const testDate = new Date(Date.UTC(year, month - 1, d));
    if (testDate.getUTCDay() === targetDow) {
      count++;
    }
  }

  return count === n;
}

function zoneOffsetMinutes(date: Date, zone: string | undefined): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = dtf.formatToParts(date);
    const get = (type: string): number => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
    const asUTC = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second')
    );
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function formatDateTime(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone === 'Local' ? undefined : timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }

    const timeStr = `${values['hour']}:${values['minute']}:${values['second']} ${values['dayPeriod']}`;
    const dateStr = `${values['weekday']}, ${values['month']} ${values['day']}, ${values['year']}`;

    const tzAbbrFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone === 'Local' ? undefined : timezone,
      timeZoneName: 'short',
    });

    const tzParts = tzAbbrFormatter.formatToParts(date);
    let tzAbbr = '';
    for (const part of tzParts) {
      if (part.type === 'timeZoneName') {
        tzAbbr = part.value;
        break;
      }
    }

    return `${dateStr} at ${timeStr} ${tzAbbr}`;
  } catch {
    return date.toString();
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  return daysPerMonth[month - 1];
}
