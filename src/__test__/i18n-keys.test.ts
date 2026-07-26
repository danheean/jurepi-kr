import { describe, it, expect } from 'vitest';
import {
  collectParityViolations,
  collectUsageViolations,
} from '../../scripts/validate-i18n.mjs';

/**
 * Recurrence guard for i18n key drift. next-intl renders a missing key as the
 * raw key path (no throw), so both drift modes below pass tsc + a scoped vitest
 * run + next build and only surface live. Enforced here AND in `prebuild`
 * (so a scoped test run can't bypass it, and the deploy build fails on drift).
 */
describe('i18n message catalogs', () => {
  it('ko.json and en.json have identical key sets (parity)', () => {
    const { koOnly, enOnly } = collectParityViolations();
    expect(
      { koOnly, enOnly },
      `Key parity drift — add missing keys to BOTH catalogs:\n` +
        `  only in ko.json: ${koOnly.join(', ') || '(none)'}\n` +
        `  only in en.json: ${enOnly.join(', ') || '(none)'}`
    ).toEqual({ koOnly: [], enOnly: [] });
  });

  it('every static t() key used in src resolves in the catalogs', () => {
    const violations = collectUsageViolations();
    const report = violations
      .map((v: { file: string; line: number; key: string }) => `${v.file}:${v.line}  t('${v.key}')`)
      .join('\n');
    expect(violations, `t() keys that resolve in NEITHER catalog (render raw key):\n${report}`).toEqual(
      []
    );
  });
});
