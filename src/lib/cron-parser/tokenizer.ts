import { Token, SyntaxError } from './schema';

export interface TokenizeResult {
  success: boolean;
  tokens?: Token[][];
  error?: SyntaxError;
}

const QUARTZ_CHARS = ['L', 'W', '#', '?'];
const VALID_MONTH_NAMES = new Set(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']);
const VALID_DAY_NAMES = new Set(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);

export function tokenizeCron(expr: string): TokenizeResult {
  const trimmed = expr.trim();

  // Handle macros
  if (trimmed.startsWith('@')) {
    return {
      success: true,
      tokens: [[{ type: 'literal', value: trimmed, position: 0 }]],
    };
  }

  // Check for Quartz syntax (but not in month/day names)
  // # and ? are never valid in POSIX
  if (trimmed.includes('#') || trimmed.includes('?')) {
    return {
      success: false,
      error: {
        type: 'syntax',
        message:
          'Quartz syntax not supported. Use standard POSIX cron: *, ranges (1-5), steps (*/15), lists (1,3,5), names (JAN-DEC, SUN-SAT).',
        position: trimmed.includes('#') ? trimmed.indexOf('#') : trimmed.indexOf('?'),
      },
    };
  }

  // L is valid only in JUL; W is valid only in WED
  // Check for L outside of JUL context
  if (trimmed.includes('L')) {
    const nonJulL = /L(?!JUL|ju|[a-z]*(?:JUL|jul))/i;
    // Simple check: if L appears and it's not immediately preceded or followed by 'JU'
    const fields = trimmed.split(/\s+/);
    for (const field of fields) {
      if (field.includes('L') && !field.toUpperCase().includes('JUL')) {
        return {
          success: false,
          error: {
            type: 'syntax',
            message:
              'Quartz syntax not supported. Use standard POSIX cron: *, ranges (1-5), steps (*/15), lists (1,3,5), names (JAN-DEC, SUN-SAT).',
            position: trimmed.indexOf('L'),
          },
        };
      }
    }
  }

  // Check for W outside of WED context
  if (trimmed.includes('W')) {
    const fields = trimmed.split(/\s+/);
    for (const field of fields) {
      if (field.includes('W') && !field.toUpperCase().includes('WED')) {
        return {
          success: false,
          error: {
            type: 'syntax',
            message:
              'Quartz syntax not supported. Use standard POSIX cron: *, ranges (1-5), steps (*/15), lists (1,3,5), names (JAN-DEC, SUN-SAT).',
            position: trimmed.indexOf('W'),
          },
        };
      }
    }
  }

  // Split by whitespace/tabs
  const fields = trimmed.split(/\s+/).filter((f) => f.length > 0);

  if (fields.length !== 5) {
    return {
      success: false,
      error: {
        type: 'syntax',
        message:
          'Cron expression must have 5 fields: minute hour day-of-month month day-of-week.',
        position: 0,
      },
    };
  }

  const tokenArrays: Token[][] = [];
  let position = 0;

  for (const field of fields) {
    const fieldTokens = tokenizeField(field, position);
    tokenArrays.push(fieldTokens);
    position += field.length + 1;
  }

  return {
    success: true,
    tokens: tokenArrays,
  };
}

function tokenizeField(field: string, basePosition: number): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < field.length) {
    const char = field[i];

    // Wildcard
    if (char === '*') {
      const start = i;
      i++;

      // Check for step (*/n)
      if (i < field.length && field[i] === '/') {
        i++; // skip /
        const stepStart = i;
        while (i < field.length && /[0-9]/.test(field[i])) {
          i++;
        }
        const step = field.substring(stepStart, i);
        tokens.push({
          type: 'step',
          value: `*/${step}`,
          position: basePosition + start,
        });
      } else {
        tokens.push({
          type: 'wildcard',
          value: '*',
          position: basePosition + start,
        });
      }
    }
    // Number or name
    else if (/[0-9A-Za-z]/.test(char)) {
      const start = i;
      while (
        i < field.length &&
        /[0-9A-Za-z]/.test(field[i])
      ) {
        i++;
      }
      const part = field.substring(start, i);

      // Check for range or step
      if (i < field.length && field[i] === '-' && field[i + 1] && /[0-9A-Za-z]/.test(field[i + 1])) {
        i++; // skip -
        const rangeStart = i;
        while (
          i < field.length &&
          /[0-9A-Za-z]/.test(field[i])
        ) {
          i++;
        }
        const rangeEnd = field.substring(rangeStart, i);

        // Check for step after range
        if (i < field.length && field[i] === '/') {
          i++; // skip /
          const stepStart = i;
          while (i < field.length && /[0-9]/.test(field[i])) {
            i++;
          }
          const step = field.substring(stepStart, i);
          tokens.push({
            type: 'range',
            value: `${part}-${rangeEnd}/${step}`,
            position: basePosition + start,
          });
        } else {
          tokens.push({
            type: 'range',
            value: `${part}-${rangeEnd}`,
            position: basePosition + start,
          });
        }
      } else {
        tokens.push({
          type: 'literal',
          value: part,
          position: basePosition + start,
        });
      }
    }
    // Comma (list separator)
    else if (char === ',') {
      i++;
    } else {
      i++;
    }
  }

  // Post-process to detect and merge lists
  const finalTokens: Token[] = [];
  let idx = 0;
  while (idx < tokens.length) {
    if (
      tokens[idx].type === 'literal' ||
      tokens[idx].type === 'range'
    ) {
      const listParts = [tokens[idx].value];
      const startPos = tokens[idx].position;
      idx++;

      // Collect consecutive items separated by commas
      while (
        idx < tokens.length &&
        (tokens[idx].type === 'literal' || tokens[idx].type === 'range')
      ) {
        listParts.push(tokens[idx].value);
        idx++;
      }

      if (listParts.length > 1) {
        finalTokens.push({
          type: 'list',
          value: listParts.join(','),
          position: startPos,
        });
      } else {
        finalTokens.push({
          type: tokens[idx - 1].type,
          value: listParts[0],
          position: startPos,
        });
      }
    } else {
      finalTokens.push(tokens[idx]);
      idx++;
    }
  }

  return finalTokens.length > 0
    ? finalTokens
    : [
        {
          type: 'literal',
          value: field,
          position: basePosition,
        },
      ];
}
