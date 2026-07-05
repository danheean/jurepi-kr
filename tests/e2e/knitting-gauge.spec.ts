import { test, expect, type Page } from '@playwright/test';

/**
 * Knitting Gauge Calculator E2E — SPEC final_integration_test scenarios 1–5.
 *
 * Every spec fails on any uncaught page error or ErrorBoundary catch so a
 * runtime crash cannot hide behind green units.
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

const TOOL_URL_KO = '/ko/tools/knitting-gauge';
const TOOL_URL_EN = '/en/tools/knitting-gauge';

test.describe('Knitting Gauge - E2E Integration', () => {
  test('Scenario 1: dimensions → cast-on stitches/rows with rounding transparency', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Default gauge 22 sts / 30 rows per 10cm, target 50×30cm → 110 sts, 90 rows
    const main = page.locator('main');
    await expect(main.getByText('110', { exact: true }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(main.getByText('90', { exact: true }).first()).toBeVisible();

    // Non-integer case: 21 sts / 10cm, want 33cm → 69.3 → 69 sts, actual 32.86cm
    const stitchesInput = main.getByLabel('코 수', { exact: true }).first();
    await stitchesInput.fill('21');
    const widthInput = main.getByLabel('원하는 폭');
    await widthInput.fill('33');

    await expect(main.getByText('69', { exact: true }).first()).toBeVisible();
    await expect(main.getByText(/32[.,]8/).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('Scenario 2: unit toggle converts exactly (2.54) and snaps default swatch', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');

    // Toggle to inch
    await main.getByRole('button', { name: '인치' }).first().click();

    // Default 10cm swatch snaps to 4in
    const swatchW = main.getByLabel('스와치 너비').first();
    await expect(swatchW).toHaveValue('4');

    // Target width 50cm → 19.69in (exact ÷2.54, NOT proportional 20)
    const widthInput = main.getByLabel('원하는 폭');
    await expect(widthInput).toHaveValue('19.69');

    expect(errors).toEqual([]);
  });

  test('Scenario 3: pattern rescale 20→22 gauge, 100 → 110 sts', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await main.getByRole('tab', { name: '패턴 환산' }).click();

    // Pattern gauge defaults 20 sts/10cm, count 100; user gauge 22/10cm → 110
    await expect(main.getByText('110', { exact: true }).first()).toBeVisible({
      timeout: 5000,
    });

    expect(errors).toEqual([]);
  });

  test('Scenario 4: gauge + saved projects persist across reload', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');

    // Change gauge and save as a named project
    const stitchesInput = main.getByLabel('코 수', { exact: true }).first();
    await stitchesInput.fill('24');
    const rowsInput = main.getByLabel('단 수', { exact: true }).first();
    await rowsInput.fill('32');

    await main.getByPlaceholder('게이지 이름 입력').fill('스웨터 앞판');
    await main.getByRole('button', { name: '저장', exact: true }).click();
    await expect(main.getByText('스웨터 앞판')).toBeVisible();

    // Debounced gauge persist (300ms) then reload
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Current gauge restored
    await expect(main.getByLabel('코 수', { exact: true }).first()).toHaveValue(
      '24'
    );
    // Saved project survived
    await expect(main.getByText('스웨터 앞판')).toBeVisible();

    // Apply after changing gauge restores the saved one
    await main.getByLabel('코 수', { exact: true }).first().fill('18');
    await main.getByRole('button', { name: '적용' }).first().click();
    await expect(main.getByLabel('코 수', { exact: true }).first()).toHaveValue(
      '24'
    );

    expect(errors).toEqual([]);
  });

  test('Scenario 5: en locale chrome, no Korean leakage, 320px no overflow', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_EN);
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(
      main.getByRole('heading', { level: 1, name: 'Knitting Gauge Calculator' })
    ).toBeVisible();

    // Visible chrome must have no Korean (user data excluded — fresh state)
    const mainText = await main.evaluate(
      (el) => (el as HTMLElement).innerText
    );
    expect(mainText).not.toMatch(/[가-힣]/);

    // Result region announces politely (scoped to the tool's own status
    // region — a bare [aria-live] would false-match ShareButtons' copy button)
    const status = main.locator('[role="status"][aria-live="polite"]');
    await expect(status).toBeAttached();
    await expect(status).toContainText(/110|Cast-On/);

    // 320px viewport: no horizontal overflow
    await page.setViewportSize({ width: 320, height: 900 });
    await page.waitForTimeout(300);
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(320);

    expect(errors).toEqual([]);
  });
});
