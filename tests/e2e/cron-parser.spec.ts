import { test, expect, type Page } from '@playwright/test';

/**
 * Cron Expression Parser E2E.
 *
 * Parsing is LIVE (SPEC): the description, field breakdown, and next-run list
 * update as the user types (debounced 200ms), with no manual trigger. Every
 * spec fails on any uncaught page error or ErrorBoundary catch so a runtime
 * crash cannot hide behind green units (restaurant-map lesson).
 *
 * Scenario 2 guards the timezone-correctness regression: cron fields are wall
 * clock in the SELECTED zone, not UTC — "0 9 * * *" in Asia/Tokyo (UTC+9, no
 * DST) must list 09:00 AM, not a UTC-shifted hour.
 */

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

const TOOL_URL_KO = '/ko/tools/cron-parser';
const TOOL_URL_EN = '/en/tools/cron-parser';

test.describe('Cron Expression Parser - E2E', () => {
  test('Scenario 1: valid expression → live description, field table, next runs', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });

    await input.fill('0 9 * * MON-FRI');

    // Human-readable description appears live (weekdays at 09:00)
    await expect(page.getByText(/평일.*09:00/)).toBeVisible({ timeout: 5_000 });

    // Field breakdown table + next-runs table both render
    const tables = page.locator('main table');
    await expect(tables).toHaveCount(2, { timeout: 5_000 });

    // Next-runs table has upcoming occurrences (header row + data rows)
    const nextRunRows = tables.last().locator('tbody tr');
    expect(await nextRunRows.count()).toBeGreaterThan(0);

    expect(errors).toEqual([]);
  });

  test('Scenario 2: cron fields are interpreted in the SELECTED timezone (not UTC)', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Asia/Tokyo is UTC+9 with no DST, so "0 9 * * *" must fire at 09:00 there.
    await page.getByRole('combobox').selectOption('Asia/Tokyo');
    await page.getByRole('textbox').first().fill('0 9 * * *');

    const firstRun = page.locator('main table').last().locator('tbody tr').first();
    await expect(firstRun).toBeVisible({ timeout: 5_000 });
    // 9 AM Tokyo — NOT shifted by the UTC offset (regression guard).
    await expect(firstRun).toContainText('09:00');
    await expect(firstRun).toContainText('AM');

    expect(errors).toEqual([]);
  });

  test('Scenario 3: invalid expression → error alert, no crash', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox').first().fill('99 9 * * *');

    // Precise error surfaces as an alert; the tool does not crash
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5_000 });

    expect(errors).toEqual([]);
  });

  test('Scenario 4: preset button populates the expression and parses live', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '매시간' }).click();

    await expect(page.getByRole('textbox').first()).toHaveValue('0 * * * *');
    await expect(page.locator('main table').last().locator('tbody tr').first()).toBeVisible({
      timeout: 5_000,
    });

    expect(errors).toEqual([]);
  });

  test('Scenario 5: English locale — no Korean leak, live parse', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_EN);
    await page.waitForLoadState('networkidle');

    // SSR SEO surface
    await expect(page.locator('main h1').first()).toBeVisible();

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('0 9 * * MON-FRI');

    // English description, no Korean characters in the interactive surface
    await expect(page.getByText(/Every weekday/i)).toBeVisible({ timeout: 5_000 });
    const toolSurface = page.locator('main .space-y-8').first();
    const text = await toolSurface.textContent();
    expect(text).not.toMatch(/[가-힣]/);

    expect(errors).toEqual([]);
  });

  test('mobile 320px: no horizontal overflow, parse usable', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);

    await page.getByRole('textbox').first().fill('0 9 * * MON-FRI');
    await expect(page.getByText(/평일.*09:00/)).toBeVisible({ timeout: 5_000 });

    expect(errors).toEqual([]);
  });
});
