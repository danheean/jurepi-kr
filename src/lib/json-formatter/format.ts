import { ParseResult, FormatOptions } from './schema';
import { lineColFromParseError } from './tokenizer';
import { MAX_INPUT_SIZE } from './constants';
import { sortKeysRecursive } from './sort-keys';

/**
 * Parse and format JSON string with given options
 * Returns formatted output or detailed error
 */
export function formatJson(jsonStr: string, options: FormatOptions): ParseResult {
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

  // Parse succeeded, now format
  try {
    const indent = options.indent === 'tab' ? '\t' : parseInt(options.indent, 10);
    let output = JSON.stringify(json, null, indent);

    // Apply sorting if requested
    if (options.sortKeys) {
      const sorted = sortKeysRecursive(json);
      output = JSON.stringify(sorted, null, indent);
    }

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
        context: 'Formatting failed',
      },
    };
  }
}

