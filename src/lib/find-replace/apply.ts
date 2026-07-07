import type { Rule, ApplyRulesResult } from './schema';
import { DEADLINE_MS } from './schema';
import { applyRule } from './rule';

/**
 * Apply multiple rules sequentially (fold).
 * Rule 0 applies to text; rule 1 applies to rule 0's output; etc.
 * This makes chaining intuitive: each rule sees the output of the previous.
 *
 * INVARIANT:
 * - Disabled or empty-find rules are skipped (perRuleCounts[i].count = 0, no error)
 * - If a rule errors, skip that rule, continue with others (rule's output from previous step)
 * - spans collected from **final output** positions (for highlight)
 * - timedOut set if any regex rule exceeded deadline
 *
 * @param text Original text
 * @param rules Rules to apply in order
 * @param opts { deadlineMs?: number } Shared deadline for all rules
 * @return ApplyRulesResult
 */
export function applyRules(
  text: string,
  rules: Rule[],
  opts?: { deadlineMs?: number }
): ApplyRulesResult {
  const deadline = Date.now() + (opts?.deadlineMs ?? DEADLINE_MS);
  let output = text;
  let totalCount = 0;
  let timedOut = false;
  const perRuleCounts: Array<{ ruleId: string; count: number; error?: any }> = [];
  // Highlight spans, always kept in the CURRENT output's coordinates. After each rule
  // we remap prior spans through that rule's edits and append the rule's new spans.
  let spans: Array<{ index: number; length: number }> = [];

  for (const rule of rules) {
    // Check if we've already timed out
    if (Date.now() > deadline) {
      timedOut = true;
      break;
    }

    // Apply rule to current output (fold pattern)
    const result = applyRule(output, rule, { deadlineMs: deadline - Date.now() });

    // Collect per-rule count
    perRuleCounts.push({
      ruleId: rule.id,
      count: result.count,
      ...(result.error && { error: result.error }),
    });

    // Update running totals
    totalCount += result.count;
    output = result.text;

    // Remap prior spans through this rule's edits, then add this rule's new spans.
    // A prior span that overlaps an edit was itself re-replaced, so it's dropped
    // (the new span from this rule covers that region on the final output).
    const edits = result.edits ?? [];
    if (edits.length > 0) {
      const remapped: Array<{ index: number; length: number }> = [];
      for (const s of spans) {
        let delta = 0;
        let overlapped = false;
        for (const e of edits) {
          if (e.inStart + e.inLen <= s.index) {
            delta += e.outLen - e.inLen; // edit fully before this span → shift it
          } else if (e.inStart < s.index + s.length) {
            overlapped = true; // edit overlaps this span → drop it (re-replaced)
            break;
          }
        }
        if (!overlapped) remapped.push({ index: s.index + delta, length: s.length });
      }
      spans = [...remapped, ...(result.spans ?? [])].sort((a, b) => a.index - b.index);
    }
    // No edits → text unchanged by this rule → prior spans stay valid as-is.
  }

  return { output, perRuleCounts, spans, totalCount, timedOut };
}
