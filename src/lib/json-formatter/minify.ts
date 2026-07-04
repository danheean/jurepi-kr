import { ParseResult } from './schema';
import { lineColFromParseError } from './tokenizer';
import { MAX_INPUT_SIZE } from './constants';

/**
 * Minify JSON string by removing whitespace
 */
export function minifyJson(jsonStr: string): ParseResult {
  // Check input size first
  if (jsonStr.length > MAX_INPUT_SIZE) {
    return {
      success: false,
      error: {
        line: 1,
        column: 1,
        token: '',
        context: 'Input too large',
      },
    };
  }

  let json: any;

  try {
    json = JSON.parse(jsonStr);
  } catch (err) {
    const tokenError = lineColFromParseError(jsonStr, err as Error);
    return {
      success: false,
      error: tokenError,
    };
  }

  // Parse succeeded, minify
  try {
    const output = JSON.stringify(json);
    return {
      success: true,
      json,
      output,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        line: 1,
        column: 1,
        token: '',
        context: 'Minification failed',
      },
    };
  }
}
