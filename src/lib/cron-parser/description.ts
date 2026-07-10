import { ParsedFields, DescriptionModel } from './schema';
import { REVERSE_DAY_MAP, REVERSE_MONTH_MAP } from './constants';

export function toDescriptionModel(fields: ParsedFields): DescriptionModel {
  // Check for every minute
  if (
    fields.minute.length === 60 &&
    fields.hour.length === 24 &&
    isFullRange(fields.dom, 1, 31) &&
    isFullRange(fields.month, 1, 12) &&
    isFullRange(fields.dow, 0, 6)
  ) {
    return {
      frequencyKind: 'everyMinute',
    };
  }

  // Check for every N minutes
  if (
    fields.hour.length === 24 &&
    isFullRange(fields.dom, 1, 31) &&
    isFullRange(fields.month, 1, 12) &&
    isFullRange(fields.dow, 0, 6) &&
    fields.minute.length > 1 &&
    fields.minute.length < 60
  ) {
    const model: DescriptionModel = {
      frequencyKind: 'everyNMinutes',
    };
    return model;
  }

  // Check for every hour
  if (
    fields.minute.length === 1 &&
    fields.minute[0] === 0 &&
    fields.hour.length === 24 &&
    isFullRange(fields.dom, 1, 31) &&
    isFullRange(fields.month, 1, 12) &&
    isFullRange(fields.dow, 0, 6)
  ) {
    return {
      frequencyKind: 'everyHour',
    };
  }

  // Determine dom/dow status
  const domIsWildcard = isFullRange(fields.dom, 1, 31);
  const dowIsWildcard = isFullRange(fields.dow, 0, 6);
  const monthIsWildcard = isFullRange(fields.month, 1, 12);

  // Check for every day (at specific times)
  if (
    fields.hour.length === 1 &&
    domIsWildcard &&
    monthIsWildcard &&
    dowIsWildcard
  ) {
    return {
      frequencyKind: 'everyDay',
      atTimes: fields.minute.map((m) => ({
        hour: fields.hour[0],
        minute: m,
      })),
    };
  }

  // Check for every weekday
  if (
    fields.hour.length === 1 &&
    fields.minute.length === 1 &&
    domIsWildcard &&
    monthIsWildcard &&
    fields.dow.length === 5 &&
    isWeekdays(fields.dow)
  ) {
    return {
      frequencyKind: 'everyWeekday',
      atTimes: [{ hour: fields.hour[0], minute: fields.minute[0] }],
    };
  }

  // Check for every weekend
  if (
    fields.hour.length === 1 &&
    fields.minute.length === 1 &&
    domIsWildcard &&
    monthIsWildcard &&
    fields.dow.length === 2 &&
    isWeekend(fields.dow)
  ) {
    return {
      frequencyKind: 'everyWeekend',
      atTimes: [{ hour: fields.hour[0], minute: fields.minute[0] }],
    };
  }

  // Check for monthly (on specific days at specific times)
  if (
    !domIsWildcard &&
    monthIsWildcard &&
    dowIsWildcard &&
    fields.hour.length === 1 &&
    fields.minute.length === 1
  ) {
    return {
      frequencyKind: 'monthly',
      atTimes: [{ hour: fields.hour[0], minute: fields.minute[0] }],
      onDatesOfMonth: fields.dom,
    };
  }

  // Check for yearly (specific day, month, and time)
  if (
    !domIsWildcard &&
    !monthIsWildcard &&
    dowIsWildcard &&
    fields.hour.length === 1 &&
    fields.minute.length === 1 &&
    fields.dom.length === 1 &&
    fields.month.length === 1
  ) {
    return {
      frequencyKind: 'yearly',
      atTimes: [{ hour: fields.hour[0], minute: fields.minute[0] }],
      onDatesOfMonth: fields.dom,
      onMonths: fields.month.map((m) => REVERSE_MONTH_MAP[m]),
    };
  }

  // Check for yearly (multiple days or months)
  if (
    !domIsWildcard &&
    !monthIsWildcard &&
    dowIsWildcard &&
    fields.hour.length === 1 &&
    fields.minute.length === 1
  ) {
    return {
      frequencyKind: 'yearly',
      atTimes: [{ hour: fields.hour[0], minute: fields.minute[0] }],
      onDatesOfMonth: fields.dom,
      onMonths: fields.month.map((m) => REVERSE_MONTH_MAP[m]),
    };
  }

  // Custom frequency
  const model: DescriptionModel = {
    frequencyKind: 'custom',
  };

  // Add atTimes if hour and minute are constrained
  if (fields.hour.length <= 3 && fields.minute.length <= 6) {
    const times: Array<{ hour: number; minute: number }> = [];
    for (const h of fields.hour) {
      for (const m of fields.minute) {
        times.push({ hour: h, minute: m });
      }
    }
    if (times.length <= 10) {
      model.atTimes = times;
    }
  }

  // Add day names if constrained
  if (!dowIsWildcard && fields.dow.length <= 7) {
    (model as any).onDays = fields.dow.map((d) => REVERSE_DAY_MAP[d]);
  }

  // Add month names if constrained
  if (!monthIsWildcard && fields.month.length <= 12) {
    (model as any).onMonths = fields.month.map((m) => REVERSE_MONTH_MAP[m]);
  }

  // Add dates if constrained
  if (!domIsWildcard && fields.dom.length <= 31) {
    (model as any).onDatesOfMonth = fields.dom;
  }

  return model;
}

function isFullRange(arr: number[], min: number, max: number): boolean {
  if (arr.length !== max - min + 1) {
    return false;
  }
  for (let i = min; i <= max; i++) {
    if (!arr.includes(i)) {
      return false;
    }
  }
  return true;
}

function isWeekdays(dow: number[]): boolean {
  const weekdaySet = new Set([1, 2, 3, 4, 5]);
  if (dow.length !== 5) {
    return false;
  }
  for (const d of dow) {
    if (!weekdaySet.has(d)) {
      return false;
    }
  }
  return true;
}

function isWeekend(dow: number[]): boolean {
  const weekendSet = new Set([0, 6]);
  // Check if exactly Saturday and Sunday (in any order)
  if (dow.length !== 2) {
    return false;
  }
  const dowSet = new Set(dow);
  return dowSet.size === 2 && dowSet.has(0) && dowSet.has(6);
}
