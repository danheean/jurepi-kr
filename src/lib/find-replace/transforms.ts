/**
 * Named transforms for find-replace presets.
 * All pure, synchronous, deterministic.
 */

import type { TransformId } from './schema';

/**
 * Convert plain text to JavaScript string literal (with escapes).
 * Example: 'hello\nworld' → '"hello\\nworld"'
 *
 * @param text Plain text
 * @return JavaScript string literal (including surrounding quotes)
 */
export function toJsString(text: string): string {
  let result = '';
  for (const char of text) {
    switch (char) {
      case '\\':
        result += '\\\\';
        break;
      case '"':
        result += '\\"';
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\t':
        result += '\\t';
        break;
      case '\b':
        result += '\\b';
        break;
      case '\f':
        result += '\\f';
        break;
      default:
        result += char;
    }
  }
  return `"${result}"`;
}

/**
 * Reverse of toJsString: convert JavaScript string literal to plain text.
 * Assumes valid JS string literal input (surrounded by quotes, with valid escapes).
 *
 * @param jsString JavaScript string literal (e.g., '"hello\\nworld"')
 * @return Plain text
 */
export function fromJsString(jsString: string): string {
  // Remove surrounding quotes
  if (jsString.length < 2 || jsString[0] !== '"' || jsString[jsString.length - 1] !== '"') {
    return jsString; // Graceful fallback for invalid input
  }

  const content = jsString.slice(1, -1);
  let result = '';
  let i = 0;

  while (i < content.length) {
    const char = content[i];

    if (char === '\\' && i + 1 < content.length) {
      const next = content[i + 1];
      switch (next) {
        case '\\':
          result += '\\';
          i += 2;
          break;
        case '"':
          result += '"';
          i += 2;
          break;
        case 'n':
          result += '\n';
          i += 2;
          break;
        case 'r':
          result += '\r';
          i += 2;
          break;
        case 't':
          result += '\t';
          i += 2;
          break;
        case 'b':
          result += '\b';
          i += 2;
          break;
        case 'f':
          result += '\f';
          i += 2;
          break;
        default:
          // Unknown escape: keep as-is
          result += char;
          i++;
      }
    } else {
      result += char;
      i++;
    }
  }

  return result;
}

/**
 * Normalize smart quotes to straight quotes.
 * Converts: " " ' ' — to: " " ' ' -
 *
 * @param text Text with possible smart quotes
 * @return Text with straight quotes
 */
export function normalizeQuotes(text: string): string {
  return text
    .replace(/["]/g, '"') // Left double quote
    .replace(/["]/g, '"') // Right double quote
    .replace(/[']/g, "'") // Left single quote
    .replace(/[']/g, "'") // Right single quote
    .replace(/—/g, '-'); // Em dash
}

/**
 * Convert fullwidth characters to halfwidth.
 * Covers fullwidth punctuation common in CJK text.
 *
 * @param text Text with possible fullwidth characters
 * @return Text with halfwidth characters
 */
export function fullwidthToHalfwidth(text: string): string {
  const mapping: { [key: string]: string } = {
    '！': '!',
    '？': '?',
    '，': ',',
    '。': '.',
    '；': ';',
    '：': ':',
    '（': '(',
    '）': ')',
    '【': '[',
    '】': ']',
    '｛': '{',
    '｝': '}',
    '「': '「',
    '」': '」',
    '『': '『',
    '』': '』',
    '、': '、',
    '・': '·',
    '　': ' ', // fullwidth space
  };

  let result = '';
  for (const char of text) {
    result += mapping[char] ?? char;
  }
  return result;
}

/**
 * Strip blank lines (lines that contain only whitespace).
 *
 * @param text Multi-line text
 * @return Text with blank lines removed
 */
export function stripBlankLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
}

/**
 * Collapse consecutive spaces into a single space.
 * Preserves newlines.
 *
 * @param text Text with possible multiple consecutive spaces
 * @return Text with consecutive spaces collapsed
 */
export function collapseSpaces(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/  +/g, ' '))
    .join('\n');
}

/**
 * Strip line numbers from the beginning of each line.
 * Handles formats like: "1. ", "001: ", "[1] ", etc.
 *
 * @param text Multi-line text with line numbers
 * @return Text with line numbers removed
 */
export function stripLineNumbers(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      // Remove line numbers in formats: "1. ", "001: ", "[1] ", etc.
      return line.replace(/^[\d\[\]]+[\.\:\)\s]+/, '');
    })
    .join('\n');
}

/**
 * Convert lines to array items format (each line becomes an array item).
 * Example: "apple\nbanana" → '"apple",\n"banana",'
 *
 * @param text Multi-line text
 * @return Array items format (quoted, comma-separated)
 */
export function linesToArrayItems(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  return lines.map((line) => `"${line}",`).join('\n');
}

/**
 * Dispatch a builtin transform by its TransformId.
 * Pure, synchronous. Every TransformId in the union maps to exactly one function,
 * so this is exhaustive (the `satisfies` map fails to compile if a new id is added
 * without a handler).
 *
 * @param id Transform identifier from a builtin preset
 * @param text Input text
 * @return Transformed text
 */
const TRANSFORMS = {
  'to-js-string': toJsString,
  'from-js-string': fromJsString,
  'normalize-quotes': normalizeQuotes,
  'fullwidth-to-halfwidth': fullwidthToHalfwidth,
  'strip-blank-lines': stripBlankLines,
  'collapse-spaces': collapseSpaces,
  'strip-line-numbers': stripLineNumbers,
  'lines-to-array-items': linesToArrayItems,
} satisfies Record<TransformId, (text: string) => string>;

export function applyTransform(id: TransformId, text: string): string {
  return TRANSFORMS[id](text);
}
