import { test, expect, type Page } from '@playwright/test';

/**
 * Base64 Encoder/Decoder E2E — SPEC final_integration_test scenarios 1–4.
 *
 * Every spec fails on any uncaught page error or ErrorBoundary catch so a
 * runtime crash cannot hide behind green units (restaurant-map lesson).
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

const TOOL_URL_KO = '/ko/tools/base64-encoder';
const TOOL_URL_EN = '/en/tools/base64-encoder';

test.describe('Base64 Encoder - E2E', () => {
  test('Scenario 1: UTF-8 text encode/decode round-trip + URL-safe variant', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Encode UTF-8 text (Korean + emoji)
    await input.fill('Hello, 안녕하세요! 😀');
    const convert = page.getByRole('button', { name: '변환' });
    await expect(convert).toBeEnabled();
    await convert.click();

    const output = page.getByRole('textbox').nth(1);
    await expect(output).not.toHaveValue('', { timeout: 5_000 });
    const encoded = await output.inputValue();
    expect(encoded).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

    // Decode it back — round-trip must be lossless
    await page.locator('input[type="radio"][value="decode"]').check();
    await input.fill(encoded);
    await convert.click();
    await expect(output).toHaveValue('Hello, 안녕하세요! 😀', { timeout: 5_000 });

    // URL-safe variant: '>>>???' encodes with + and / in standard, - and _ in URL-safe
    await page.locator('input[type="radio"][value="encode"]').check();
    await page.locator('input[type="radio"][value="urlSafe"]').check();
    await input.fill('>>>???');
    await convert.click();
    await expect(output).toHaveValue('Pj4-Pz8_', { timeout: 5_000 });

    expect(errors).toEqual([]);
  });

  test('Scenario 2: file upload encode + download button', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Switch to file mode
    await page.locator('input[type="radio"][value="file"]').check();

    // Upload a small text file via the (hidden) file input
    await page.locator('input[type="file"]').setInputFiles({
      name: 'sample.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello file'),
    });

    // File feedback appears
    await expect(page.getByText(/sample\.txt/)).toBeVisible({ timeout: 5_000 });

    // Convert → Base64 of file contents
    await page.getByRole('button', { name: '변환' }).click();
    const output = page.getByRole('textbox').first();
    await expect(output).toHaveValue(
      Buffer.from('hello file').toString('base64'),
      { timeout: 5_000 }
    );

    // Download button visible in file+encode mode and fires a download
    const downloadButton = page.getByRole('button', { name: '다운로드' });
    await expect(downloadButton).toBeEnabled();
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample.txt');

    expect(errors).toEqual([]);
  });

  test('Scenario 3: preference persistence + invalid Base64 validation', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Change persisted prefs: mode=file, variant=urlSafe
    await page.locator('input[type="radio"][value="file"]').check();
    await page.locator('input[type="radio"][value="urlSafe"]').check();
    // persistPrefs debounce is 50ms
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('input[type="radio"][value="file"]')).toBeChecked({
      timeout: 10_000,
    });
    await expect(
      page.locator('input[type="radio"][value="urlSafe"]')
    ).toBeChecked();

    // Invalid Base64 in decode direction blocks processing (validation contract)
    await page.locator('input[type="radio"][value="text"]').check();
    await page.locator('input[type="radio"][value="decode"]').check();
    const input = page.getByRole('textbox').first();
    await input.fill('ABC!@#');
    await expect(page.getByRole('button', { name: '변환' })).toBeDisabled();

    // Valid Base64 decodes successfully (standard charset → switch variant back)
    await page.locator('input[type="radio"][value="standard"]').check();
    await input.fill('aGVsbG8gd29ybGQ=');
    const convert = page.getByRole('button', { name: '변환' });
    await expect(convert).toBeEnabled();
    await convert.click();
    await expect(page.getByRole('textbox').nth(1)).toHaveValue('hello world', {
      timeout: 5_000,
    });

    expect(errors).toEqual([]);
  });

  test('Scenario 4: English locale — full chrome, no Korean leak, semantics', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_EN);
    await page.waitForLoadState('networkidle');

    // SSR SEO surface
    await expect(page.locator('main h1').first()).toBeVisible();

    // Interactive chrome in English
    const convert = page.getByRole('button', { name: 'Convert' });
    await expect(convert).toBeVisible({ timeout: 10_000 });

    // No Korean characters in the interactive tool surface
    const toolSurface = page.locator('main .space-y-8').first();
    const text = await toolSurface.textContent();
    expect(text).not.toMatch(/[가-힣]/);

    // Semantic checks: radios grouped and labelled, output labelled
    const radios = page.locator('main input[type="radio"]');
    expect(await radios.count()).toBeGreaterThanOrEqual(6);
    await expect(
      page.getByRole('textbox', { name: 'Output' })
    ).toBeVisible();

    // End-to-end encode works in EN
    await page.getByRole('textbox').first().fill('hello');
    await convert.click();
    await expect(page.getByRole('textbox').nth(1)).toHaveValue('aGVsbG8=', {
      timeout: 5_000,
    });

    expect(errors).toEqual([]);
  });

  test('mobile 320px: no horizontal overflow, tool usable', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);

    const input = page.getByRole('textbox').first();
    await input.fill('mobile');
    await page.getByRole('button', { name: '변환' }).click();
    await expect(page.getByRole('textbox').nth(1)).toHaveValue('bW9iaWxl', {
      timeout: 5_000,
    });

    expect(errors).toEqual([]);
  });
});
