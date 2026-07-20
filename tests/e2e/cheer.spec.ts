import { test, expect } from '@playwright/test';

/**
 * Everyone's Cheer (모두의 응원) — E2E.
 * A pageerror/console hard gate runs on every scenario (external SDK-free tool,
 * so any error is a real defect).
 */
test.describe('Cheer - E2E', () => {
  function trackErrors(page: import('@playwright/test').Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    return errors;
  }

  test('Scenario 1: typing a message shows it on the banner (no errors)', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/cheer');

    const input = page.locator('#cheer-input');
    await input.fill('우리 팀 우승!');

    const banner = page.getByRole('img', { name: /응원 배너/ });
    await expect(banner).toHaveAttribute('aria-label', /우리 팀 우승!/);

    expect(errors).toEqual([]);
  });

  test('Scenario 2: a preset chip fills the input and banner with its localized phrase', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/cheer');

    await page.getByRole('button', { name: '앵콜!' }).click();

    await expect(page.locator('#cheer-input')).toHaveValue('앵콜!');
    await expect(page.getByRole('img', { name: /응원 배너/ })).toHaveAttribute(
      'aria-label',
      /앵콜!/
    );
    expect(errors).toEqual([]);
  });

  test('Scenario 3: switching effect to static keeps the message visible', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/ko/tools/cheer');

    await page.locator('#cheer-input').fill('파이팅!');
    await page.getByRole('button', { name: '정적' }).click();

    const banner = page.getByRole('img', { name: /응원 배너/ });
    await expect(banner).toContainText('파이팅!');
    expect(errors).toEqual([]);
  });

  test('Scenario 4: English locale renders without Korean chrome leaking', async ({
    page,
  }) => {
    const errors = trackErrors(page);
    await page.goto('/en/tools/cheer');
    await page.evaluate(() => localStorage.removeItem('jurepi-cheer'));
    await page.reload();

    // Control labels are localized to English
    await expect(page.getByText('Effect', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Encore!' })).toBeVisible();

    // No Korean in the main tool chrome (user-typed text is out of scope here)
    const hangul = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return (main.innerText.match(/[가-힣]/g) || []).length;
    });
    expect(hangul).toBe(0);
    expect(errors).toEqual([]);
  });

  test('Scenario 5: no horizontal overflow at 320px', async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/ko/tools/cheer');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
});
