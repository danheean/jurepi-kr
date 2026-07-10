import { ParsedFields } from './schema';
import { parseCron } from './parser';

export function expandMacro(
  macro: string
): ParsedFields & { error?: any } {
  const expanded = getMacroExpansion(macro.toLowerCase().trim());

  if (!expanded) {
    return {
      minute: [],
      hour: [],
      dom: [],
      month: [],
      dow: [],
      isValid: false,
      error: {
        field: 'macro',
        message: `Unknown macro: ${macro}. Valid macros: @yearly, @monthly, @weekly, @daily, @hourly.`,
      },
    };
  }

  // Recursively parse the expanded expression
  return parseCron(expanded);
}

function getMacroExpansion(macro: string): string | null {
  const expansions: Record<string, string> = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
  };

  return expansions[macro] || null;
}
