import type { Rule, RuleApplyResult, InvalidPatternError } from './schema';
import { DEADLINE_MS } from './schema';
import { escapeRegExp } from './escape';
import { compile } from './compile';
import { replaceWithSpans, expandTemplate } from './replace-with-spans';

/**
 * Apply a single rule to text.
 * Handles both literal and regex modes, with options (case-sensitive, whole-word, first-only).
 * Includes ReDoS guard for regex mode.
 *
 * INVARIANT:
 * - empty find → no-op (count=0, text unchanged, no error)
 * - disabled rule → no-op
 * - invalid regex pattern → error set, text unchanged, count=0
 * - whole-word in literal mode: use unicode-aware word boundary (not ASCII \b)
 * - zero-length match in regex → advance lastIndex to prevent infinite loop
 * - regex mode guarded with deadline check
 *
 * @param text Original text
 * @param rule Rule to apply
 * @param opts { deadlineMs?: number } ReDoS guard deadline
 * @return RuleApplyResult
 */
export function applyRule(
  text: string,
  rule: Rule,
  opts?: { deadlineMs?: number }
): RuleApplyResult {
  // No-op if rule disabled or find is empty
  if (!rule.enabled || rule.find === '') {
    return { text, count: 0 };
  }

  const deadline = Date.now() + (opts?.deadlineMs ?? DEADLINE_MS);

  if (rule.isRegex) {
    return applyRegexRule(text, rule, deadline);
  } else {
    return applyLiteralRule(text, rule);
  }
}

/**
 * Apply a literal (plain-text) rule.
 * Always safe (O(n)), no infinite loops.
 */
function applyLiteralRule(text: string, rule: Rule): RuleApplyResult {
  if (rule.find === '') {
    return { text, count: 0 };
  }

  // Build the pattern for literal search
  let pattern = rule.find;
  if (rule.wholeWord) {
    // Use unicode-aware word boundary (not ASCII \b)
    // Pattern: (?<!\w)pattern(?!\w) — word boundary via negative lookahead/lookbehind
    // This is more Unicode-friendly than \b for CJK, emoji, etc.
    pattern = `(?<!\\w)${escapeRegExp(pattern)}(?!\\w)`;
  } else {
    pattern = escapeRegExp(pattern);
  }

  // Flags: g for replace-all (unless firstOnly), i for case-insensitive
  let flags = 'g';
  if (!rule.caseSensitive) {
    flags += 'i';
  }
  if (rule.firstOnly) {
    // Replace first only: don't use global flag
    flags = flags.replace('g', '');
  }

  try {
    const regex = new RegExp(pattern, flags);
    // Literal replacement: the "replace with" text is inserted verbatim (no $ expansion),
    // so the per-match replacement is simply rule.replace. replaceWithSpans records the
    // output-coordinate spans for highlighting.
    const { text: newText, count, spans, edits } = replaceWithSpans(
      text,
      regex,
      () => rule.replace
    );
    return { text: newText, count, spans, edits };
  } catch (err) {
    // Should not happen for escaped literal, but be defensive
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      text,
      count: 0,
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
 * Apply a regex rule with ReDoS guard.
 * Deadline-checked loop: break if wall-clock exceeds deadline.
 */
function applyRegexRule(
  text: string,
  rule: Rule,
  deadline: number
): RuleApplyResult {
  // Compile the regex
  const compileResult = compile(rule.find, rule.flags || '', rule.firstOnly);
  if (!compileResult.ok) {
    return {
      text,
      count: 0,
      error: compileResult.error,
    };
  }

  const regex = compileResult.regex;

  try {
    // Best-effort ReDoS guard: pre-walk the matches with a per-iteration deadline
    // check so a slow multi-match regex is caught before we build the output.
    // (A single catastrophic match can still block one exec — documented in the FAQ.)
    let currentIndex = 0;
    let lastIndex = 0;
    while (currentIndex <= text.length) {
      if (Date.now() > deadline) {
        return {
          text,
          count: 0,
          error: {
            code: 'invalid_pattern',
            message: 'Regex execution timed out (possible catastrophic backtracking)',
            pattern: rule.find,
            flags: rule.flags || '',
          },
        };
      }
      regex.lastIndex = currentIndex;
      const match = regex.exec(text);
      if (!match) break;
      if (match.index === lastIndex && match[0].length === 0) {
        currentIndex = lastIndex + 1;
        continue;
      }
      lastIndex = regex.lastIndex;
      currentIndex = lastIndex;
      if (rule.firstOnly) break;
    }

    // Build the output with output-coordinate spans. The compiled regex's global
    // flag already encodes replace-all vs first-only, and $-expansion matches native
    // String.replace semantics via expandTemplate.
    regex.lastIndex = 0;
    const { text: newText, count, spans, edits } = replaceWithSpans(
      text,
      regex,
      (m) => expandTemplate(rule.replace, m)
    );
    return { text: newText, count, spans, edits };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      text,
      count: 0,
      error: {
        code: 'invalid_pattern',
        message,
        pattern: rule.find,
        flags: rule.flags || '',
      },
    };
  }
}
