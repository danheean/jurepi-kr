import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for 문장 바꾸기 (Text Replacer / find-replace).
 * Based on the SPEC integration scenarios 1–5 + an invalid-regex hard gate.
 *
 * Hard gate: a per-rule invalid regex must NEVER crash the tool (no pageerror,
 * no ErrorBoundary fallback) — other rules keep applying.
 */

const ERROR_BOUNDARY = /문제가 발생했어요|Something went wrong/;

function trackErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (e) => errors.push(e));
  return errors;
}

async function assertNoCrash(page: Page, errors: Error[], name: string) {
  expect(errors, `${name}: no page errors`).toHaveLength(0);
  const boundary = await page
    .locator(`text=${ERROR_BOUNDARY.source}`)
    .isVisible()
    .catch(() => false);
  expect(boundary, `${name}: no ErrorBoundary fallback`).toBe(false);
}

test.describe('find-replace — E2E', () => {
  test('Scenario 1: two literal rules apply together (top-to-bottom)', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/find-replace');

    const source = page.locator('textarea').first();
    await expect(source).toBeVisible({ timeout: 5000 });
    await source.fill('고양이가 강아지를 만났다.');

    // Rule 1: 고양이 → 호랑이
    await page.getByRole('textbox', { name: '찾을 내용' }).first().fill('고양이');
    await page.getByRole('textbox', { name: '바꿀 내용' }).first().fill('호랑이');

    // Rule 2: 강아지 → 여우
    await page.getByRole('button', { name: '규칙 추가' }).click();
    await page.getByRole('textbox', { name: '찾을 내용' }).nth(1).fill('강아지');
    await page.getByRole('textbox', { name: '바꿀 내용' }).nth(1).fill('여우');

    await page.waitForTimeout(300); // apply debounce

    // Result region shows the transformed text (built from highlighted <mark> + plain nodes,
    // so assert with toContainText which spans child elements).
    await expect(page.getByTestId('result-output')).toContainText('호랑이가 여우를 만났다.');
    await expect(page.locator('mark').filter({ hasText: '호랑이' })).toHaveCount(1);
    await expect(page.locator('mark').filter({ hasText: '여우' })).toHaveCount(1);

    // Copy button becomes enabled once there is output
    await expect(page.getByTestId('copy-result-button')).toBeEnabled();

    await assertNoCrash(page, errors, 'Scenario 1');
  });

  test('Scenario 2: regex mode with capture groups reorders a date', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/find-replace');

    await page.locator('textarea').first().fill('2026-07-07');

    // Toggle regex (the ".*" option button)
    await page.getByRole('button', { name: '정규식', exact: true }).first().click();

    await page.getByRole('textbox', { name: '찾을 내용' }).first().fill('(\\d{4})-(\\d{2})-(\\d{2})');
    await page.getByRole('textbox', { name: '바꿀 내용' }).first().fill('$3/$2/$1');
    await page.waitForTimeout(300);

    await expect(page.getByTestId('result-output')).toContainText('07/07/2026');
    await assertNoCrash(page, errors, 'Scenario 2');
  });

  test('Scenario 3: built-in preset transforms the source text', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/find-replace');

    await page.locator('textarea').first().fill('한\n줄\n둘');
    // "여러 줄 → JavaScript 문자열" builtin transform escapes + quotes the text.
    await page.getByRole('button', { name: '여러 줄 → JavaScript 문자열' }).click();
    await page.waitForTimeout(200);

    // The source textarea now holds the escaped JS string literal.
    await expect(page.locator('textarea').first()).toHaveValue(/^".*\\n.*"$/s);
    await assertNoCrash(page, errors, 'Scenario 3');
  });

  test('Scenario 4: invalid regex never crashes; other rules keep working (HARD GATE)', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/find-replace');

    await page.locator('textarea').first().fill('a b c');

    // Rule 1: invalid regex "(" in regex mode → per-rule error, no crash
    await page.getByRole('button', { name: '정규식', exact: true }).first().click();
    await page.getByRole('textbox', { name: '찾을 내용' }).first().fill('(');
    await page.waitForTimeout(200);
    await expect(page.getByText('유효하지 않은 정규식')).toBeVisible();

    // Rule 2 (literal) still applies: a → X
    await page.getByRole('button', { name: '규칙 추가' }).click();
    await page.getByRole('textbox', { name: '찾을 내용' }).nth(1).fill('a');
    await page.getByRole('textbox', { name: '바꿀 내용' }).nth(1).fill('X');
    await page.waitForTimeout(300);

    await expect(page.getByTestId('result-output')).toContainText('X b c');
    await assertNoCrash(page, errors, 'Scenario 4');
  });

  test('Scenario 5: en locale renders English chrome and persists rules across reload', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/en/tools/find-replace');

    // English chrome, no missing-message keys
    await expect(page.getByRole('heading', { name: 'Text Replacer', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add rule' })).toBeVisible();

    // Build a rule, then reload — it should persist (localStorage, 500ms persist debounce).
    await page.getByRole('textbox', { name: 'Find' }).first().fill('color');
    await page.getByRole('textbox', { name: 'Replace with' }).first().fill('colour');

    // Deterministically wait for the debounced persist to actually land before reloading.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('jurepi-find-replace') ?? ''))
      .toContain('colour');

    await page.reload();
    // Wait for the client tool to re-mount before asserting restored state.
    await expect(page.getByRole('button', { name: 'Add rule' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Find' }).first()).toHaveValue('color');
    await expect(page.getByRole('textbox', { name: 'Replace with' }).first()).toHaveValue('colour');

    await assertNoCrash(page, errors, 'Scenario 5');
  });
});
