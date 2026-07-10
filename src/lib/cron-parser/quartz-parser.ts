import { QuartzFields, DomSpec, DowSpec } from './quartz-schema';
import { MONTH_MAP, DAY_MAP } from './constants';

export function parseQuartz(expression: string): QuartzFields {
  const fields = expression.trim().split(/\s+/);

  // Check field count (6 or 7)
  if (fields.length < 6 || fields.length > 7) {
    return {
      second: [],
      minute: [],
      hour: [],
      dom: emptyDomSpec(),
      month: [],
      dow: emptyDowSpec(),
      hasYear: false,
      isValid: false,
      error: { field: 'expression', message: 'fieldCount' },
    };
  }

  const hasYear = fields.length === 7;

  // Parse each field
  const secondResult = parseNumericField(fields[0], 0, 59, 'second');
  const minuteResult = parseNumericField(fields[1], 0, 59, 'minute');
  const hourResult = parseNumericField(fields[2], 0, 23, 'hour');
  const domResult = parseDomField(fields[3]);
  const monthResult = parseMonthField(fields[4]);
  const dowResult = parseDowField(fields[5]);
  const yearResult = hasYear ? parseYearField(fields[6]) : { values: [], error: null };

  // Check for errors
  const errors = [secondResult, minuteResult, hourResult, monthResult, yearResult]
    .filter((r) => r.error)
    .map((r) => r.error!);

  if (domResult.error) errors.push(domResult.error);
  if (dowResult.error) errors.push(dowResult.error);

  // Check dom/dow exclusivity: cannot have both dom and dow with specific values
  if (errors.length === 0) {
    const domSpecified =
      !domResult.spec.noSpecific ||
      domResult.spec.lastDay ||
      domResult.spec.lastWeekday ||
      domResult.spec.nearestWeekday ||
      domResult.spec.lastOffset;
    const dowSpecified =
      !dowResult.spec.noSpecific ||
      dowResult.spec.last !== undefined ||
      dowResult.spec.nth !== undefined;

    if (domSpecified && dowSpecified) {
      errors.push({ field: 'dom', message: 'bothSpecified' });
    }
  }

  if (errors.length > 0) {
    return {
      second: [],
      minute: [],
      hour: [],
      dom: emptyDomSpec(),
      month: [],
      dow: emptyDowSpec(),
      hasYear,
      isValid: false,
      error: errors[0],
    };
  }

  return {
    second: secondResult.values,
    minute: minuteResult.values,
    hour: hourResult.values,
    dom: domResult.spec,
    month: monthResult.values,
    dow: dowResult.spec,
    year: yearResult.values.length > 0 ? yearResult.values : undefined,
    hasYear,
    isValid: true,
  };
}

function emptyDomSpec(): DomSpec {
  return {
    values: [],
    noSpecific: false,
    lastDay: false,
    lastWeekday: false,
  };
}

function emptyDowSpec(): DowSpec {
  return {
    values: [],
    noSpecific: false,
  };
}

interface ParseResult {
  values: number[];
  error: null | { field: string; message: string };
}

interface DomResult {
  spec: DomSpec;
  error: null | { field: string; message: string };
}

interface DowResult {
  spec: DowSpec;
  error: null | { field: string; message: string };
}

function parseNumericField(
  field: string,
  min: number,
  max: number,
  fieldName: string
): ParseResult {
  if (field === '*') {
    const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return { values, error: null };
  }

  const parts = field.split(',');
  const values = new Set<number>();

  for (const part of parts) {
    // Handle step: "start/step" or "*/step"
    if (part.includes('/')) {
      const [start, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);

      if (isNaN(step)) {
        return { values: [], error: { field: fieldName, message: 'invalidStep' } };
      }

      const startNum = start === '*' ? min : parseInt(start, 10);
      if (isNaN(startNum)) {
        return { values: [], error: { field: fieldName, message: 'invalidValue' } };
      }

      if (startNum < min || startNum > max || step < 1) {
        return { values: [], error: { field: fieldName, message: 'outOfRange' } };
      }

      for (let i = startNum; i <= max; i += step) {
        values.add(i);
      }
    } else if (part.includes('-')) {
      // Handle range: "start-end"
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        return { values: [], error: { field: fieldName, message: 'invalidValue' } };
      }

      if (start < min || end > max || start > end) {
        return { values: [], error: { field: fieldName, message: 'outOfRange' } };
      }

      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      const num = parseInt(part, 10);
      if (isNaN(num)) {
        return { values: [], error: { field: fieldName, message: 'invalidValue' } };
      }

      if (num < min || num > max) {
        return { values: [], error: { field: fieldName, message: 'outOfRange' } };
      }

      values.add(num);
    }
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  return { values: sorted, error: null };
}

function parseDomField(field: string): DomResult {
  const spec: DomSpec = emptyDomSpec();

  if (field === '?') {
    spec.noSpecific = true;
    return { spec, error: null };
  }

  if (field === '*') {
    // All days (1-31)
    spec.values = Array.from({ length: 31 }, (_, i) => i + 1);
    return { spec, error: null };
  }

  // Handle special patterns: L, L-k, LW, nW
  const parts = field.split(',');

  for (const part of parts) {
    if (part === 'L') {
      spec.lastDay = true;
    } else if (part.startsWith('L-')) {
      spec.lastDay = true;
      const offset = parseInt(part.slice(2), 10);
      if (isNaN(offset) || offset < 1) {
        return { spec, error: { field: 'dom', message: 'invalidPattern' } };
      }
      spec.lastOffset = offset;
    } else if (part === 'LW') {
      spec.lastWeekday = true;
    } else if (part.endsWith('W')) {
      const day = parseInt(part.slice(0, -1), 10);
      if (isNaN(day) || day < 1 || day > 31) {
        return { spec, error: { field: 'dom', message: 'outOfRange' } };
      }
      spec.nearestWeekday = day;
    } else {
      // Regular numeric value
      const num = parseInt(part, 10);
      if (isNaN(num)) {
        return { spec, error: { field: 'dom', message: 'invalidValue' } };
      }

      if (num < 1 || num > 31) {
        return { spec, error: { field: 'dom', message: 'outOfRange' } };
      }

      spec.values.push(num);
    }
  }

  spec.values = Array.from(new Set(spec.values)).sort((a, b) => a - b);
  return { spec, error: null };
}

function parseMonthField(field: string): ParseResult {
  if (field === '*') {
    return { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], error: null };
  }

  const parts = field.split(',');
  const values = new Set<number>();

  for (const part of parts) {
    if (part.includes('/')) {
      // Step
      const [start, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);

      if (isNaN(step)) {
        return { values: [], error: { field: 'month', message: 'invalidStep' } };
      }

      const startNum = start === '*' ? 1 : parseMonthName(start);
      if (startNum === null || startNum < 1 || startNum > 12) {
        return { values: [], error: { field: 'month', message: 'invalidValue' } };
      }

      for (let i = startNum; i <= 12; i += step) {
        values.add(i);
      }
    } else if (part.includes('-')) {
      // Range
      const [startStr, endStr] = part.split('-');
      const start = parseMonthName(startStr);
      const end = parseMonthName(endStr);

      if (start === null || end === null || start < 1 || end > 12 || start > end) {
        return { values: [], error: { field: 'month', message: 'outOfRange' } };
      }

      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      const num = parseMonthName(part);
      if (num === null || num < 1 || num > 12) {
        return { values: [], error: { field: 'month', message: 'outOfRange' } };
      }

      values.add(num);
    }
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  return { values: sorted, error: null };
}

function parseMonthName(value: string): number | null {
  const num = parseInt(value, 10);
  if (!isNaN(num)) {
    return num;
  }

  const upper = value.toUpperCase();
  return MONTH_MAP[upper] ?? null;
}

function parseDowField(field: string): DowResult {
  const spec: DowSpec = emptyDowSpec();

  if (field === '?') {
    spec.noSpecific = true;
    return { spec, error: null };
  }

  if (field === '*') {
    spec.values = [0, 1, 2, 3, 4, 5, 6];
    return { spec, error: null };
  }

  // Handle special patterns: dowL, dow#n, and regular values
  const parts = field.split(',');

  for (const part of parts) {
    if (part.endsWith('L')) {
      // dowL: last occurrence
      const dow = parseQuartzDow(part.slice(0, -1));
      if (dow === null) {
        return { spec, error: { field: 'dow', message: 'invalidValue' } };
      }

      if (spec.last !== undefined && spec.last !== dow) {
        // Can't have multiple last specifications
        return { spec, error: { field: 'dow', message: 'invalidPattern' } };
      }

      spec.last = dow;
    } else if (part.includes('#')) {
      // dow#n: nth occurrence
      const [dowStr, nStr] = part.split('#');
      const dow = parseQuartzDow(dowStr);
      const n = parseInt(nStr, 10);

      if (dow === null || isNaN(n) || n < 1 || n > 5) {
        return { spec, error: { field: 'dow', message: 'invalidPattern' } };
      }

      if (spec.nth !== undefined && (spec.nth.dow !== dow || spec.nth.n !== n)) {
        // Can't have multiple nth specifications
        return { spec, error: { field: 'dow', message: 'invalidPattern' } };
      }

      spec.nth = { dow, n };
    } else if (part.includes('-')) {
      // Range
      const [startStr, endStr] = part.split('-');
      const start = parseQuartzDow(startStr);
      const end = parseQuartzDow(endStr);

      if (start === null || end === null || start > end) {
        return { spec, error: { field: 'dow', message: 'outOfRange' } };
      }

      for (let i = start; i <= end; i++) {
        spec.values.push(i);
      }
    } else if (part.includes('/')) {
      // Step
      const [start, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);

      if (isNaN(step)) {
        return { spec, error: { field: 'dow', message: 'invalidStep' } };
      }

      const startNum = start === '*' ? 0 : parseQuartzDow(start);
      if (startNum === null || startNum < 0 || startNum > 6 || step < 1) {
        return { spec, error: { field: 'dow', message: 'invalidValue' } };
      }

      for (let i = startNum; i <= 6; i += step) {
        spec.values.push(i);
      }
    } else {
      // Single value
      const num = parseQuartzDow(part);
      if (num === null || num < 0 || num > 6) {
        return { spec, error: { field: 'dow', message: 'outOfRange' } };
      }

      spec.values.push(num);
    }
  }

  spec.values = Array.from(new Set(spec.values)).sort((a, b) => a - b);
  return { spec, error: null };
}

function parseQuartzDow(value: string): number | null {
  // Quartz dow: 1=SUN..7=SAT (can also be 0=SUN)
  // Internal: 0=SUN..6=SAT
  const upper = value.toUpperCase();

  // Try name first
  const dayMap = DAY_MAP as Record<string, number>;
  if (upper in dayMap) {
    return dayMap[upper];
  }

  // Try numeric
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return null;
  }

  // Normalize Quartz range 1-7 to 0-6
  if (num === 0) {
    return 0; // SUN
  }

  if (num >= 1 && num <= 7) {
    return num - 1; // 1-7 -> 0-6
  }

  return null;
}

function parseYearField(field: string): ParseResult {
  if (field === '*') {
    const values = Array.from({ length: 130 }, (_, i) => 1970 + i);
    return { values, error: null };
  }

  const parts = field.split(',');
  const values = new Set<number>();

  for (const part of parts) {
    if (part.includes('/')) {
      // Step
      const [start, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);

      if (isNaN(step)) {
        return { values: [], error: { field: 'year', message: 'invalidStep' } };
      }

      const startNum = start === '*' ? 1970 : parseInt(start, 10);
      if (isNaN(startNum) || startNum < 1970 || startNum > 2099) {
        return { values: [], error: { field: 'year', message: 'outOfRange' } };
      }

      for (let i = startNum; i <= 2099; i += step) {
        values.add(i);
      }
    } else if (part.includes('-')) {
      // Range
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start < 1970 || end > 2099 || start > end) {
        return { values: [], error: { field: 'year', message: 'outOfRange' } };
      }

      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 1970 || num > 2099) {
        return { values: [], error: { field: 'year', message: 'outOfRange' } };
      }

      values.add(num);
    }
  }

  const sorted = Array.from(values).sort((a, b) => a - b);
  return { values: sorted, error: null };
}
