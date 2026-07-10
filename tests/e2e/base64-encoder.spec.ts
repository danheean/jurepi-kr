import { test, expect, type Page } from '@playwright/test';

/**
 * Base64 Encoder/Decoder E2E — SPEC final_integration_test scenarios 1–4.
 *
 * Conversion is LIVE (SPEC): output tracks input/settings in real time with no
 * manual trigger. Every spec fails on any uncaught page error or ErrorBoundary
 * catch so a runtime crash cannot hide behind green units (restaurant-map lesson).
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
  test('Scenario 1: UTF-8 text encode/decode round-trip + URL-safe variant (live)', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    const output = page.getByRole('textbox').nth(1);

    // No manual Convert button — conversion is live
    await expect(page.getByRole('button', { name: '변환' })).toHaveCount(0);

    // Encode UTF-8 text (Korean + emoji) — output appears live
    await input.fill('Hello, 안녕하세요! 😀');
    await expect(output).not.toHaveValue('', { timeout: 5_000 });
    const encoded = await output.inputValue();
    expect(encoded).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

    // Decode it back — round-trip must be lossless
    await page.locator('input[type="radio"][value="decode"]').check();
    await input.fill(encoded);
    await expect(output).toHaveValue('Hello, 안녕하세요! 😀', { timeout: 5_000 });

    // URL-safe variant: '>>>???' encodes with - and _ in URL-safe
    await page.locator('input[type="radio"][value="encode"]').check();
    await page.locator('input[type="radio"][value="urlSafe"]').check();
    await input.fill('>>>???');
    await expect(output).toHaveValue('Pj4-Pz8_', { timeout: 5_000 });

    expect(errors).toEqual([]);
  });

  test('Scenario 2: file upload encodes live + download button', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Switch to file mode
    await page.locator('input[type="radio"][value="file"]').check();

    // Upload a small text file via the (hidden) file input — encodes live
    await page.locator('input[type="file"]').setInputFiles({
      name: 'sample.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello file'),
    });

    // File feedback appears
    await expect(page.getByText(/sample\.txt/)).toBeVisible({ timeout: 5_000 });

    // Base64 of file contents appears without any manual trigger
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

  test('Scenario 3: preference persistence + live invalid Base64 validation', async ({
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

    // Valid Base64 decodes live
    await page.locator('input[type="radio"][value="text"]').check();
    await page.locator('input[type="radio"][value="decode"]').check();
    await page.locator('input[type="radio"][value="standard"]').check();
    const input = page.getByRole('textbox').first();
    const output = page.getByRole('textbox').nth(1);
    await input.fill('aGVsbG8gd29ybGQ=');
    await expect(output).toHaveValue('hello world', { timeout: 5_000 });

    // Invalid Base64 in decode → output clears (validation contract, no crash)
    await input.fill('ABC!@#');
    await expect(output).toHaveValue('', { timeout: 5_000 });

    expect(errors).toEqual([]);
  });

  test('Scenario 4: English locale — full chrome, no Korean leak, live encode', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_EN);
    await page.waitForLoadState('networkidle');

    // SSR SEO surface
    await expect(page.locator('main h1').first()).toBeVisible();

    // Interactive chrome loaded (input visible), no manual Convert button
    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Convert' })).toHaveCount(0);

    // No Korean characters in the interactive tool surface
    const toolSurface = page.locator('main .space-y-8').first();
    const text = await toolSurface.textContent();
    expect(text).not.toMatch(/[가-힣]/);

    // Semantic checks: radios grouped and labelled, output labelled
    const radios = page.locator('main input[type="radio"]');
    expect(await radios.count()).toBeGreaterThanOrEqual(6);
    await expect(page.getByRole('textbox', { name: 'Output' })).toBeVisible();

    // End-to-end encode works live in EN
    await input.fill('hello');
    await expect(page.getByRole('textbox').nth(1)).toHaveValue('aGVsbG8=', {
      timeout: 5_000,
    });

    expect(errors).toEqual([]);
  });

  test('Scenario 5: decoding image Base64 renders an image preview + download', async ({
    page,
  }) => {
    // 1x1 transparent PNG.
    const PNG_1x1 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });

    // Decode direction, paste raw PNG Base64 (no data: prefix)
    await page.locator('input[type="radio"][value="decode"]').check();
    await input.fill(PNG_1x1);

    // The decoded image is shown as an <img> (not garbled text)
    const img = page.locator('main img[src^="data:image/png"]');
    await expect(img).toBeVisible({ timeout: 5_000 });

    // Download the decoded image
    const downloadButton = page.getByRole('button', { name: '이미지 다운로드' });
    await expect(downloadButton).toBeVisible();
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    expect(errors).toEqual([]);
  });

  test('Scenario 6: decoding an image data: URL renders an image preview (regression)', async ({
    page,
  }) => {
    // A pasted data URI is exactly what the encode side's "Copy Data-URI"
    // produces. The validation gate used to reject the data: prefix, so the
    // image round-trip silently produced no output.
    const PNG_DATA_URL =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="radio"][value="decode"]').check();
    await input.fill(PNG_DATA_URL);

    // The image renders (previously: empty output).
    const img = page.locator('main img[src^="data:image/png"]');
    await expect(img).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: '이미지 다운로드' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('Scenario 7: decoding a non-image binary data URL offers a file download', async ({
    page,
  }) => {
    // "JVBERi0xLjQK" = "%PDF-1.4\n"; declared MIME application/pdf → file card.
    const PDF_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjQK';

    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.getByRole('textbox').first();
    await expect(input).toBeVisible({ timeout: 10_000 });

    await page.locator('input[type="radio"][value="decode"]').check();
    await input.fill(PDF_DATA_URL);

    // A file-download card appears (not an image, not a text output).
    const downloadButton = page.getByRole('button', { name: '파일 다운로드' });
    await expect(downloadButton).toBeVisible({ timeout: 5_000 });
    // No decoded-image preview for a non-image payload.
    await expect(page.locator('main img[src^="data:image"]')).toHaveCount(0);

    // Downloading names the file by its MIME extension (.pdf).
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await downloadButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    expect(errors).toEqual([]);
  });

  test('mobile 320px: no horizontal overflow, live conversion usable', async ({
    page,
  }) => {
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
    await expect(page.getByRole('textbox').nth(1)).toHaveValue('bW9iaWxl', {
      timeout: 5_000,
    });

    expect(errors).toEqual([]);
  });
});
