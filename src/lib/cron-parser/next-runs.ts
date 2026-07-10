import { ParsedFields, NextRun } from './schema';
import { NEXT_RUNS_LIMIT, MAX_LOOKAHEAD_YEARS } from './constants';

export interface NextRunOptions {
  now: Date;
  timezone: string;
  limit?: number;
  maxYears?: number;
}

export function computeNextRuns(
  fields: ParsedFields,
  options: NextRunOptions
): NextRun[] {
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

  // Start from the next minute (UTC-aligned; offsets are whole minutes).
  const current = new Date(now.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Cron fields describe wall-clock time in the SELECTED timezone (default: the
  // viewer's local zone), NOT UTC. We iterate absolute minutes and compare the
  // wall-clock components in that zone. A zone's UTC offset is constant except at
  // DST transitions, which fall on hour boundaries — so we refresh the offset
  // once per UTC hour instead of per minute: correct across DST, and cheap enough
  // for the sparse-expression worst case (per-minute Intl formatting would not be).
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

    // Refresh the zone offset at UTC hour boundaries (covers DST transitions).
    const hourKey = Math.floor(current.getTime() / 3_600_000);
    if (hourKey !== offsetHourKey) {
      offsetMinutes = zoneOffsetMinutes(current, zone);
      offsetHourKey = hourKey;
    }

    // Wall-clock components in the target zone: shift the instant by the offset,
    // then read the UTC parts of the shifted value.
    const local = new Date(current.getTime() + offsetMinutes * 60000);
    const month = local.getUTCMonth() + 1; // 1-12
    const date = local.getUTCDate();
    const day = local.getUTCDay(); // 0-6
    const hours = local.getUTCHours();
    const minutes = local.getUTCMinutes();

    // Check if this wall-clock time matches the cron expression
    if (
      fields.minute.includes(minutes) &&
      fields.hour.includes(hours) &&
      fields.month.includes(month) &&
      matchesDomOrDow(fields, date, day)
    ) {
      // Valid match found — store the absolute instant, format it in the zone
      runs.push({
        datetime: new Date(current),
        formatted: formatDateTime(current, timezone),
        utc: current.toISOString(),
      });
    }

    // Advance by 1 minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  // If we hit max iterations with fewer results, the expression might have no valid runs
  return runs.slice(0, limit);
}

/**
 * UTC offset (in minutes) of `zone` at the given instant: wall-clock − UTC.
 * `undefined` means the runtime's local zone. Invalid zone names fall back to 0
 * (UTC interpretation), mirroring formatDateTime's fallback so a bad timezone
 * still yields results instead of throwing.
 */
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
    const get = (type: string): number =>
      parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
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

function matchesDomOrDow(
  fields: ParsedFields,
  date: number,
  day: number
): boolean {
  const domIsWildcard = fields.dom.length === 31; // All days
  const dowIsWildcard = fields.dow.length === 7; // All days

  if (domIsWildcard && dowIsWildcard) {
    // Both wildcards: match any date
    return true;
  }

  if (domIsWildcard) {
    // Only dow specified: match by day-of-week
    return fields.dow.includes(day);
  }

  if (dowIsWildcard) {
    // Only dom specified: match by day-of-month
    return fields.dom.includes(date);
  }

  // Both specified: OR logic (match dom OR dow)
  return fields.dom.includes(date) || fields.dow.includes(day);
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

    // Build formatted string: "Monday, July 15, 2026 at 9:00:00 AM EDT"
    const timeStr = `${values['hour']}:${values['minute']} ${values['dayPeriod']}`;
    const dateStr = `${values['weekday']}, ${values['month']} ${values['day']}, ${values['year']}`;

    // Get timezone abbreviation
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
    // Fallback if timezone is invalid
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
