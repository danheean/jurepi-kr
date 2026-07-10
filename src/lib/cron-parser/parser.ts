import { ParsedFields } from './schema';
import { tokenizeCron } from './tokenizer';
import {
  FIELD_RANGES,
  MONTH_MAP,
  DAY_MAP,
} from './constants';
import { expandMacro } from './macros';

export function parseCron(expr: string): ParsedFields {
  const tokenResult = tokenizeCron(expr);

  if (!tokenResult.success) {
    return {
      minute: [],
      hour: [],
      dom: [],
      month: [],
      dow: [],
      isValid: false,
      error: {
        field: 'syntax',
        message: tokenResult.error?.message || 'Invalid expression',
      },
    };
  }

  // Check for macros
  if (expr.trim().startsWith('@')) {
    const macroResult = expandMacro(expr.trim());
    if (!macroResult.isValid) {
      return {
        minute: [],
        hour: [],
        dom: [],
        month: [],
        dow: [],
        isValid: false,
        error: {
          field: 'macro',
          message: macroResult.error?.message || 'Unknown macro',
        },
      };
    }
    return macroResult;
  }

  const tokens = tokenResult.tokens!;
  const fieldNames = ['minute', 'hour', 'dom', 'month', 'dow'] as const;
  const result: ParsedFields = {
    minute: [],
    hour: [],
    dom: [],
    month: [],
    dow: [],
    isValid: true,
  };

  for (let i = 0; i < 5; i++) {
    const fieldName = fieldNames[i];
    const range = FIELD_RANGES[fieldName];
    const fieldTokens = tokens[i];

    const parseResult = parseField(
      fieldTokens,
      fieldName,
      range.min,
      range.max,
      fieldName === 'month' ? MONTH_MAP : fieldName === 'dow' ? DAY_MAP : {}
    );

    if (!parseResult.isValid) {
      return {
        minute: [],
        hour: [],
        dom: [],
        month: [],
        dow: [],
        isValid: false,
        error: parseResult.error,
      };
    }

    result[fieldName] = parseResult.values!;
  }

  return result;
}

function parseField(
  tokens: any[],
  fieldName: string,
  min: number,
  max: number,
  nameMap: Record<string, number> = {}
): { isValid: boolean; values?: number[]; error?: any } {
  const values = new Set<number>();

  for (const token of tokens) {
    if (token.type === 'wildcard') {
      for (let i = min; i <= max; i++) {
        values.add(i);
      }
    } else if (token.type === 'literal') {
      const parsed = parseLiteral(
        token.value,
        min,
        max,
        fieldName,
        nameMap
      );
      if (!parsed.isValid) {
        return {
          isValid: false,
          error: {
            field: fieldName,
            message: parsed.error || `Invalid value: ${token.value}`,
          },
        };
      }
      parsed.values?.forEach((v) => values.add(v));
    } else if (token.type === 'step') {
      const parsed = parseStep(token.value, min, max, fieldName, nameMap);
      if (!parsed.isValid) {
        return {
          isValid: false,
          error: {
            field: fieldName,
            message: parsed.error || `Invalid step: ${token.value}`,
          },
        };
      }
      parsed.values?.forEach((v) => values.add(v));
    } else if (token.type === 'range') {
      const parsed = parseRange(token.value, min, max, fieldName, nameMap);
      if (!parsed.isValid) {
        return {
          isValid: false,
          error: {
            field: fieldName,
            message: parsed.error || `Invalid range: ${token.value}`,
          },
        };
      }
      parsed.values?.forEach((v) => values.add(v));
    } else if (token.type === 'list') {
      // Parse each item in the list separated by commas
      const parts = token.value.split(',');
      for (const part of parts) {
        // Each part could be a literal, range, or step
        if (part.includes('/')) {
          const parsed = parseStep(part, min, max, fieldName, nameMap);
          if (!parsed.isValid) {
            return {
              isValid: false,
              error: {
                field: fieldName,
                message: parsed.error || `Invalid step in list: ${part}`,
              },
            };
          }
          parsed.values?.forEach((v) => values.add(v));
        } else if (part.includes('-')) {
          const parsed = parseRange(part, min, max, fieldName, nameMap);
          if (!parsed.isValid) {
            return {
              isValid: false,
              error: {
                field: fieldName,
                message: parsed.error || `Invalid range in list: ${part}`,
              },
            };
          }
          parsed.values?.forEach((v) => values.add(v));
        } else {
          const parsed = parseLiteral(part, min, max, fieldName, nameMap);
          if (!parsed.isValid) {
            return {
              isValid: false,
              error: {
                field: fieldName,
                message: parsed.error || `Invalid value in list: ${part}`,
              },
            };
          }
          parsed.values?.forEach((v) => values.add(v));
        }
      }
    }
  }

  // Handle special dow case: convert 7 to 0
  if (fieldName === 'dow' && values.has(7)) {
    values.delete(7);
    values.add(0);
  }

  return {
    isValid: true,
    values: Array.from(values).sort((a, b) => a - b),
  };
}

function parseLiteral(
  value: string,
  min: number,
  max: number,
  fieldName: string,
  nameMap: Record<string, number>
): { isValid: boolean; values?: number[]; error?: string } {
  // Try as number
  if (/^\d+$/.test(value)) {
    const num = parseInt(value, 10);
    // Special case: day 7 is Sunday (0)
    if (fieldName === 'dow' && num === 7) {
      return { isValid: true, values: [0] };
    }
    if (num < min || num > max) {
      return {
        isValid: false,
        error: `Invalid value ${num} (must be ${min}–${max})`,
      };
    }
    return { isValid: true, values: [num] };
  }

  // Try as name
  const upper = value.toUpperCase();
  if (upper in nameMap) {
    return { isValid: true, values: [nameMap[upper]] };
  }

  return {
    isValid: false,
    error: `Unknown value: ${value}`,
  };
}

function parseRange(
  value: string,
  min: number,
  max: number,
  fieldName: string,
  nameMap: Record<string, number>
): { isValid: boolean; values?: number[]; error?: string } {
  // Format: "start-end" or "start-end/step"
  const [rangeStr, stepStr] = value.split('/');
  const [startStr, endStr] = rangeStr.split('-');

  if (!startStr || !endStr) {
    return { isValid: false, error: `Invalid range format: ${value}` };
  }

  const startResult = parseLiteral(startStr, min, max, fieldName, nameMap);
  if (!startResult.isValid || !startResult.values) {
    return { isValid: false, error: `Invalid range start: ${startStr}` };
  }

  const endResult = parseLiteral(endStr, min, max, fieldName, nameMap);
  if (!endResult.isValid || !endResult.values) {
    return { isValid: false, error: `Invalid range end: ${endStr}` };
  }

  const start = startResult.values[0];
  const end = endResult.values[0];
  let step = 1;

  if (stepStr) {
    if (!/^\d+$/.test(stepStr)) {
      return { isValid: false, error: `Invalid step: ${stepStr}` };
    }
    step = parseInt(stepStr, 10);
    if (step <= 0) {
      return { isValid: false, error: `Step must be > 0` };
    }
  }

  const values: number[] = [];
  if (start <= end) {
    for (let i = start; i <= end; i += step) {
      values.push(i);
    }
  } else if (fieldName === 'dow') {
    // Special case for day-of-week: SAT-SUN wraps around
    for (let i = start; i <= max; i += step) {
      values.push(i);
    }
    for (let i = min; i <= end; i += step) {
      values.push(i);
    }
  } else {
    // For other fields, disallow backwards ranges
    return { isValid: false, error: `Invalid range: ${value}` };
  }

  return { isValid: true, values };
}

function parseStep(
  value: string,
  min: number,
  max: number,
  fieldName: string,
  nameMap: Record<string, number>
): { isValid: boolean; values?: number[]; error?: string } {
  // Format: "*/step" or "start-end/step"
  const [baseStr, stepStr] = value.split('/');

  if (!stepStr) {
    return { isValid: false, error: `Invalid step format: ${value}` };
  }

  if (!/^\d+$/.test(stepStr)) {
    return { isValid: false, error: `Invalid step: ${stepStr}` };
  }

  const step = parseInt(stepStr, 10);
  if (step <= 0) {
    return { isValid: false, error: `Step must be > 0` };
  }

  const values: number[] = [];

  if (baseStr === '*') {
    // */step covers the entire range
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
  } else {
    // start-end/step
    const rangeResult = parseRange(`${baseStr}/${step}`, min, max, fieldName, nameMap);
    if (!rangeResult.isValid) {
      return rangeResult;
    }
    return rangeResult;
  }

  return { isValid: true, values };
}
