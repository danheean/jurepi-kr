import { FLAG_SET, InvalidPatternError, CompileResult } from './schema';

/**
 * Compile a regex pattern and flags into a RegExp object.
 * Never throws — returns an error object on invalid pattern.
 *
 * INVARIANT:
 * - flags ⊆ {i,m,s,u,y}, no duplicates
 * - global flag (g) is added implicitly (caller controls via firstOnly)
 * - invalid pattern → CompileResult with ok=false and error details
 *
 * @param pattern Regex source (e.g., "(\\d+)-(\\d+)")
 * @param flags Subset of "imsuy", or empty string
 * @param firstOnly If true, do NOT add global flag
 * @return CompileResult
 */
export function compile(
  pattern: string,
  flags: string = '',
  firstOnly: boolean = false
): CompileResult {
  try {
    // Validate flags: must be subset of FLAG_SET, no duplicates
    const flagsSet = new Set(flags.split(''));
    for (const flag of flagsSet) {
      if (!FLAG_SET.includes(flag)) {
        return {
          ok: false,
          error: {
            code: 'invalid_pattern',
            message: `Invalid flag: "${flag}". Allowed: ${FLAG_SET}`,
            pattern,
            flags,
          },
        };
      }
    }

    // Check for duplicate flags
    if (flagsSet.size !== flags.length) {
      return {
        ok: false,
        error: {
          code: 'invalid_pattern',
          message: `Duplicate flags in "${flags}"`,
          pattern,
          flags,
        },
      };
    }

    // Add global flag unless firstOnly
    let finalFlags = flags;
    if (!firstOnly && !flags.includes('g')) {
      finalFlags = flags + 'g';
    }

    // Try to compile the regex
    const regex = new RegExp(pattern, finalFlags);
    return { ok: true, regex };
  } catch (err) {
    // Catch SyntaxError or any error from RegExp constructor
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      ok: false,
      error: {
        code: 'invalid_pattern',
        message,
        pattern,
        flags,
      },
    };
  }
}

/**
 * Validate a pattern for use in regex mode (without global flag).
 * Used by UI to catch errors early.
 *
 * @param pattern Regex source
 * @param flags Flags subset
 * @return CompileResult
 */
export function compileForValidation(
  pattern: string,
  flags: string = ''
): CompileResult {
  return compile(pattern, flags, true);
}
