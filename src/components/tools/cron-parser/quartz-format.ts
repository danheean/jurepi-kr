/**
 * Pure formatting functions for Quartz fields.
 * Separated from React components for TDD.
 *
 * A `null` return means "the field spans its full range" — the caller renders
 * the localized "All" label (never a hardcoded English word, which would leak
 * into the Korean locale).
 */

import { DomSpec, DowSpec, REVERSE_DAY_MAP } from '@/lib/cron-parser';

function joinList(values: number[], mapper?: (n: number) => string): string {
  const shown = values.slice(0, 10);
  const text = shown.map((v) => (mapper ? mapper(v) : String(v))).join(', ');
  return values.length > 10 ? `${text}…` : text;
}

/**
 * Format a numeric field (second, minute, hour, month, year).
 * Returns `null` for the full range (caller shows the localized "All"),
 * `''` for an empty set, else a comma-separated list truncated at 10.
 */
export function formatNumberField(
  values: number[],
  fullRange: number
): string | null {
  if (values.length === 0) return '';
  if (values.length >= fullRange) return null;
  return joinList(values);
}

/**
 * Format day-of-month specification.
 * Returns '?', 'L', 'L-{n}', 'LW', '{n}W', a date list, or `null` for the full range.
 */
export function formatDomSpec(dom: DomSpec): string | null {
  if (dom.noSpecific) return '?';
  if (dom.lastDay) return 'L';
  if (dom.lastOffset !== undefined) return `L-${dom.lastOffset}`;
  if (dom.lastWeekday) return 'LW';
  if (dom.nearestWeekday !== undefined) return `${dom.nearestWeekday}W`;
  return formatNumberField(dom.values, 31);
}

/**
 * Format day-of-week specification.
 * Returns '?', '{DAY}L', '{DAY}#{n}', a day-symbol list, or `null` for the full range.
 */
export function formatDowSpec(dow: DowSpec): string | null {
  if (dow.noSpecific) return '?';
  if (dow.last !== undefined) return `${REVERSE_DAY_MAP[dow.last]}L`;
  if (dow.nth !== undefined) return `${REVERSE_DAY_MAP[dow.nth.dow]}#${dow.nth.n}`;
  if (dow.values.length >= 7) return null;
  return joinList(dow.values, (v) => REVERSE_DAY_MAP[v]);
}
