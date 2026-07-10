/**
 * Quartz Cron Schema — 6-7 fields (second minute hour dom month dow [year])
 * Internal representation after parsing, before next-runs computation.
 */

/** Quartz day-of-month specification */
export interface DomSpec {
  values: number[]; // 1-31, sorted, explicit values
  noSpecific: boolean; // true if '?'
  lastDay: boolean; // true if 'L'
  lastOffset?: number; // L-k → k
  lastWeekday: boolean; // true if 'LW'
  nearestWeekday?: number; // dW → d
}

/** Quartz day-of-week specification (0-6 internally, 0=SUN) */
export interface DowSpec {
  values: number[]; // 0-6, sorted
  noSpecific: boolean; // true if '?'
  last?: number; // dowL → dow (e.g. 5L = last FRI)
  nth?: { dow: number; n: number }; // dow#n (e.g. 6#3 = 3rd SAT)
}

/** Parsed Quartz cron expression */
export interface QuartzFields {
  second: number[]; // 0-59
  minute: number[]; // 0-59
  hour: number[]; // 0-23
  dom: DomSpec; // day-of-month spec
  month: number[]; // 1-12
  dow: DowSpec; // day-of-week spec (0-6)
  year?: number[]; // 1970-2099 (optional)
  hasYear: boolean; // true if 7 fields provided
  isValid: boolean;
  error?: { field: string; message: string };
}

/** Structured description (UI will i18n-render) */
export interface QuartzDescriptionModel {
  frequencyKind:
    | 'everySecond'
    | 'everyNSeconds'
    | 'everyMinute'
    | 'everyNMinutes'
    | 'everyHour'
    | 'everyDay'
    | 'custom';
  atTimes?: Array<{ hour: number; minute: number; second: number }>;
  domKind?: 'specific' | 'lastDay' | 'lastOffset' | 'lastWeekday' | 'nearestWeekday' | 'noSpecific';
  domDetail?: { dates?: number[]; offset?: number; nearest?: number };
  dowKind?: 'specific' | 'last' | 'nth' | 'noSpecific';
  dowDetail?: { days?: string[]; last?: string; nth?: { day: string; n: number } };
  onMonths?: string[];
  years?: number[];
}
