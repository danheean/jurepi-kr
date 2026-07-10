import { QuartzFields, QuartzDescriptionModel } from './quartz-schema';
import { REVERSE_DAY_MAP, REVERSE_MONTH_MAP } from './constants';

export function describeQuartz(fields: QuartzFields): QuartzDescriptionModel {
  // Determine frequency kind
  const frequencyKind = detectFrequencyKind(fields);

  // Extract time specifications if applicable
  const atTimes = extractAtTimes(fields);

  // Analyze dom
  const { domKind, domDetail } = analyzeDom(fields);

  // Analyze dow
  const { dowKind, dowDetail } = analyzeDow(fields);

  // Extract months
  const onMonths = extractMonths(fields);

  // Extract years
  const years = fields.year && fields.year.length > 0 ? fields.year : undefined;

  return {
    frequencyKind,
    atTimes: atTimes.length > 0 ? atTimes : undefined,
    domKind,
    domDetail,
    dowKind,
    dowDetail,
    onMonths: onMonths.length > 0 ? onMonths : undefined,
    years,
  };
}

function detectFrequencyKind(
  fields: QuartzFields
): 'everySecond' | 'everyNSeconds' | 'everyMinute' | 'everyNMinutes' | 'everyHour' | 'everyDay' | 'custom' {
  // Check if all non-time fields are wildcards
  const monthsAll = fields.month.length === 12 && fields.month[0] === 1 && fields.month[11] === 12;
  const domAll =
    fields.dom.values.length === 31 &&
    !fields.dom.noSpecific &&
    !fields.dom.lastDay &&
    !fields.dom.lastWeekday &&
    !fields.dom.nearestWeekday &&
    !fields.dom.lastOffset;
  const domUnspecified = fields.dom.noSpecific;
  const dowAll = fields.dow.values.length === 7 && !fields.dow.noSpecific && !fields.dow.last && !fields.dow.nth;
  const dowUnspecified = fields.dow.noSpecific;

  // Seconds only vary: every second
  if (
    fields.second.length === 60 &&
    fields.minute.length === 60 &&
    fields.hour.length === 24 &&
    monthsAll &&
    domAll &&
    dowUnspecified
  ) {
    return 'everySecond';
  }

  // Specific seconds with everything else wildcard: every N seconds
  if (
    fields.second.length > 1 &&
    fields.second.length < 60 &&
    fields.minute.length === 60 &&
    fields.hour.length === 24 &&
    monthsAll &&
    domAll &&
    dowUnspecified
  ) {
    return 'everyNSeconds';
  }

  // Minutes only vary: every minute
  if (
    fields.second.length === 1 &&
    fields.second[0] === 0 &&
    fields.minute.length === 60 &&
    fields.hour.length === 24 &&
    monthsAll &&
    domAll &&
    dowUnspecified
  ) {
    return 'everyMinute';
  }

  // Specific minutes with everything else wildcard: every N minutes
  if (
    fields.second.length === 1 &&
    fields.second[0] === 0 &&
    fields.minute.length > 1 &&
    fields.minute.length < 60 &&
    fields.hour.length === 24 &&
    monthsAll &&
    domAll &&
    dowUnspecified
  ) {
    return 'everyNMinutes';
  }

  // Hours only vary: every hour
  if (
    fields.second.length === 1 &&
    fields.second[0] === 0 &&
    fields.minute.length === 1 &&
    fields.minute[0] === 0 &&
    fields.hour.length === 24 &&
    monthsAll &&
    domAll &&
    dowUnspecified
  ) {
    return 'everyHour';
  }

  // Day only varies (dom or dow): every day
  if (
    fields.second.length === 1 &&
    fields.second[0] === 0 &&
    fields.minute.length === 1 &&
    fields.minute[0] === 0 &&
    fields.hour.length === 1 &&
    fields.hour[0] === 0 &&
    monthsAll &&
    ((domAll && dowUnspecified) || (domUnspecified && dowAll))
  ) {
    return 'everyDay';
  }

  return 'custom';
}

function extractAtTimes(fields: QuartzFields): Array<{ hour: number; minute: number; second: number }> {
  const times: Array<{ hour: number; minute: number; second: number }> = [];

  // Only extract times if they're specific (not wildcards)
  if (
    fields.second.length >= 1 &&
    fields.second.length <= 59 &&
    fields.minute.length >= 1 &&
    fields.minute.length <= 59 &&
    fields.hour.length >= 1 &&
    fields.hour.length <= 23
  ) {
    for (const h of fields.hour) {
      for (const m of fields.minute) {
        for (const s of fields.second) {
          times.push({ hour: h, minute: m, second: s });
        }
      }
    }

    // Sort by hour, then minute, then second
    times.sort((a, b) => a.hour - b.hour || a.minute - b.minute || a.second - b.second);
  }

  return times;
}

interface DomAnalysis {
  domKind:
    | 'specific'
    | 'lastDay'
    | 'lastOffset'
    | 'lastWeekday'
    | 'nearestWeekday'
    | 'noSpecific';
  domDetail?: { dates?: number[]; offset?: number; nearest?: number };
}

function analyzeDom(fields: QuartzFields): DomAnalysis {
  if (fields.dom.noSpecific) {
    return { domKind: 'noSpecific' };
  }

  if (fields.dom.lastDay && fields.dom.lastOffset) {
    return {
      domKind: 'lastOffset',
      domDetail: { offset: fields.dom.lastOffset },
    };
  }

  if (fields.dom.lastDay) {
    return { domKind: 'lastDay' };
  }

  if (fields.dom.lastWeekday) {
    return { domKind: 'lastWeekday' };
  }

  if (fields.dom.nearestWeekday !== undefined) {
    return {
      domKind: 'nearestWeekday',
      domDetail: { nearest: fields.dom.nearestWeekday },
    };
  }

  if (fields.dom.values.length > 0) {
    return {
      domKind: 'specific',
      domDetail: { dates: fields.dom.values },
    };
  }

  return { domKind: 'noSpecific' };
}

interface DowAnalysis {
  dowKind: 'specific' | 'last' | 'nth' | 'noSpecific';
  dowDetail?: { days?: string[]; last?: string; nth?: { day: string; n: number } };
}

function analyzeDow(fields: QuartzFields): DowAnalysis {
  if (fields.dow.noSpecific) {
    return { dowKind: 'noSpecific' };
  }

  if (fields.dow.last !== undefined) {
    return {
      dowKind: 'last',
      dowDetail: { last: REVERSE_DAY_MAP[fields.dow.last] },
    };
  }

  if (fields.dow.nth) {
    return {
      dowKind: 'nth',
      dowDetail: { nth: { day: REVERSE_DAY_MAP[fields.dow.nth.dow], n: fields.dow.nth.n } },
    };
  }

  if (fields.dow.values.length > 0) {
    return {
      dowKind: 'specific',
      dowDetail: { days: fields.dow.values.map((v) => REVERSE_DAY_MAP[v]) },
    };
  }

  return { dowKind: 'noSpecific' };
}

function extractMonths(fields: QuartzFields): string[] {
  // If all 12 months, return empty
  if (fields.month.length === 12 && fields.month[0] === 1 && fields.month[11] === 12) {
    return [];
  }

  return fields.month.map((m) => REVERSE_MONTH_MAP[m]);
}
