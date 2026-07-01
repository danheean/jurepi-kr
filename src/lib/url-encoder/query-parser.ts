import type { QueryTableRow } from './schema';
import { encodeComponent, encodeUri } from './encode';

/**
 * Parse query string into rows. Handles ?, leading &, trailing &.
 * Uses native decodeURIComponent (UTF-8 only, default for parsing).
 */
export function parseQueryString(input: string): QueryTableRow[] {
  let clean = input.trim();
  if (clean.startsWith('?')) {
    clean = clean.slice(1);
  }
  if (!clean) {
    return [];
  }

  return clean
    .split('&')
    .filter((pair) => pair.length > 0)
    .map((pair) => {
      const [key, ...valueParts] = pair.split('=');
      return {
        key: decodeURIComponent(key),
        value: valueParts.length > 0 ? decodeURIComponent(valueParts.join('=')) : '',
      };
    });
}

/**
 * Serialize rows back to query string.
 * Applies encoding based on mode/charset.
 */
export async function serializeQueryTable(
  rows: QueryTableRow[],
  mode: 'component' | 'uri' = 'component',
  charset: 'utf-8' | 'euc-kr' = 'utf-8',
): Promise<string> {
  const encodeFn = mode === 'component' ? encodeComponent : encodeUri;

  const encoded = await Promise.all(
    rows.map(async (row) => {
      const encodedKey = await encodeFn(row.key, charset);
      const encodedValue = await encodeFn(row.value, charset);
      return `${encodedKey}=${encodedValue}`;
    }),
  );

  return encoded.join('&');
}

/**
 * Edit a row: immutable update.
 */
export function editRow(
  rows: QueryTableRow[],
  index: number,
  newKey: string,
  newValue: string,
): QueryTableRow[] {
  if (index < 0 || index >= rows.length) {
    return rows;
  }

  return [
    ...rows.slice(0, index),
    { key: newKey, value: newValue },
    ...rows.slice(index + 1),
  ];
}

/**
 * Delete a row by index.
 */
export function deleteRow(rows: QueryTableRow[], index: number): QueryTableRow[] {
  if (index < 0 || index >= rows.length) {
    return rows;
  }

  return [...rows.slice(0, index), ...rows.slice(index + 1)];
}

/**
 * Add a new empty row.
 */
export function addRow(rows: QueryTableRow[]): QueryTableRow[] {
  return [...rows, { key: '', value: '' }];
}

// Re-export for convenience
export type { QueryTableRow };
