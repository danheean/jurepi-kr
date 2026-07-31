import { test, expect } from '@playwright/test';

/**
 * 나의 탄생 비밀 (Birthday Secrets) — E2E.
 * Client-side birthday → profile tool + monthly SSG spokes. A pageerror/console
 * hard gate runs on every scenario (no external SDK, so any error is a defect).
 */
test.describe('Birthday Secrets - E2E', () => {
  function trackErrors(page: import('@playwright/test').Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    return errors;
  }

  test('Scenario 1: entering a birthday reveals the flower/stone/color profile', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/birthday-secret');

    await page.getByLabel('태어난 월').selectOption('4');
    await page.getByLabel('태어난 일').selectOption('15');

    // Stone for April is 다이아몬드
    await expect(page.getByText('다이아몬드').first()).toBeVisible();
    await expect(page.getByText('영원한 사랑').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Scenario 2: ?date permalink restores the profile', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/birthday-secret?date=07-01');
    // July stone is 루비
    await expect(page.getByText('루비').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Scenario 3: month grid anchor navigates to the monthly spoke', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/birthday-secret');
    await page.getByRole('link', { name: '4월', exact: true }).click();
    await expect(page).toHaveURL(/\/tools\/birthday-secret\/april$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('4월');
    await expect(page.getByText('다이아몬드').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Scenario 4: English spoke has no Korean leakage in the main content', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/en/tools/birthday-secret/april');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('April');
    const mainText = await page.locator('main').innerText();
    expect(mainText).not.toMatch(/[가-힣]/);
    expect(errors).toEqual([]);
  });

  test('Scenario 5: hub has no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/ko/tools/birthday-secret?date=12-25');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });
});
