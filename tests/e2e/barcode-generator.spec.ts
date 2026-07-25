import { test, expect, type Page } from '@playwright/test';

/**
 * Barcode Generator E2E — SPEC final_integration_test scenarios.
 *
 * Every spec fails on any uncaught page error or ErrorBoundary catch so a
 * runtime crash cannot hide behind green units (this project's recurring
 * "green tests hid a live crash" failure mode).
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

const TOOL_URL_KO = '/ko/tools/barcode-generator';
const TOOL_URL_EN = '/en/tools/barcode-generator';

test.describe('Barcode Generator - E2E Integration', () => {
  test('Scenario 1: EAN-13 base digits auto-calculate checksum and render a barcode', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);

    await page.getByLabel('인코딩할 값').fill('978014300723');

    const canvas = page.getByTestId('barcode-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);

    await expect(page.getByTestId('download-png-button')).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test('Scenario 2: a mistyped EAN-13 checksum digit shows an error and disables downloads', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);

    // Valid is ...9780143007234 — mistype the final digit.
    await page.getByLabel('인코딩할 값').fill('9780143007233');

    // Scope past Next.js's own `role="alert"` route announcer element.
    await expect(page.getByText('체크섬이 유효하지 않습니다')).toBeVisible();
    await expect(page.getByTestId('download-png-button')).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('Scenario 3: UPC-A, Code 39, and Code 128 each encode successfully', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);

    await page.getByTestId('format-tab-upc').click();
    await page.getByLabel('인코딩할 값').fill('12345678901');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();
    await expect(page.getByTestId('download-png-button')).toBeEnabled();

    await page.getByTestId('format-tab-code39').click();
    await page.getByLabel('인코딩할 값').fill('HELLO-WORLD');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();
    await expect(page.getByTestId('download-png-button')).toBeEnabled();

    await page.getByTestId('format-tab-code128').click();
    await page.getByLabel('인코딩할 값').fill('Hello, World! 123');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();
    await expect(page.getByTestId('download-png-button')).toBeEnabled();

    expect(errors).toEqual([]);
  });

  test('Scenario 4: switching format clears the input and disables downloads until re-typed', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);

    await page.getByLabel('인코딩할 값').fill('978014300723');
    await expect(page.getByTestId('download-png-button')).toBeEnabled();

    await page.getByTestId('format-tab-code128').click();
    await expect(page.getByLabel('인코딩할 값')).toHaveValue('');
    await expect(page.getByTestId('download-png-button')).toBeDisabled();

    expect(errors).toEqual([]);
  });

  test('Scenario 5: downloads PNG and SVG as independent files', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.getByLabel('인코딩할 값').fill('978014300723');
    await expect(page.getByTestId('download-png-button')).toBeEnabled();

    const [pngDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-png-button').click(),
    ]);
    expect(pngDownload.suggestedFilename()).toBe('barcode.png');

    const [svgDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('download-svg-button').click(),
    ]);
    expect(svgDownload.suggestedFilename()).toBe('barcode.svg');

    expect(errors).toEqual([]);
  });

  test('Scenario 6: the size slider changes the rendered canvas width', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.getByLabel('인코딩할 값').fill('978014300723');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();

    const initialBox = await page.getByTestId('barcode-canvas').boundingBox();
    await page.getByTestId('size-slider').fill('300');
    // Let the resize effect settle.
    await expect
      .poll(async () => {
        const box = await page.getByTestId('barcode-canvas').boundingBox();
        return box?.width;
      })
      .not.toBe(initialBox?.width);

    expect(errors).toEqual([]);
  });

  test('Scenario 7: hiding human-readable text removes it from the canvas region', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.getByLabel('인코딩할 값').fill('978014300723');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();

    const initialBox = await page.getByTestId('barcode-canvas').boundingBox();
    await page.getByLabel('가독형 텍스트 표시').click();

    // Hiding the text line shrinks the reserved canvas height.
    await expect
      .poll(async () => {
        const box = await page.getByTestId('barcode-canvas').boundingBox();
        return box?.height;
      })
      .toBeLessThan(initialBox?.height ?? Infinity);

    expect(errors).toEqual([]);
  });

  test('Scenario 8: English locale renders localized labels with no Korean leakage', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_EN);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Barcode Generator');
    await page.getByLabel('Value to encode').fill('978014300723');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();

    const mainText = await page.locator('main').innerText();
    expect(mainText).not.toMatch(/[가-힣]/);
    expect(errors).toEqual([]);
  });

  test('Scenario 9: 320px viewport has no horizontal overflow in the tool content', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(TOOL_URL_KO);
    await page.getByLabel('인코딩할 값').fill('978014300723');
    await expect(page.getByTestId('barcode-canvas')).toBeVisible();

    // Scoped to <main> (the tool's own content), not document.documentElement —
    // the shared site header already overflows ~12px at 320px on every tool
    // (confirmed on the live qr-code page too), which is a pre-existing,
    // site-wide layout issue outside this feature's scope.
    const mainBox = await page.locator('main').boundingBox();
    expect(mainBox?.width).toBeLessThanOrEqual(320);
    expect(errors).toEqual([]);
  });

  test('Scenario 10: format tabs are keyboard-navigable with arrow keys', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);

    await page.getByTestId('format-tab-ean13').click();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('format-tab-upc')).toHaveAttribute('aria-selected', 'true');

    expect(errors).toEqual([]);
  });

  test('Scenario 11: prefetched SEO content is present without a mounted-gate (Intro/HowTo/Faq/JSON-LD)', async ({
    page,
  }) => {
    await page.goto(TOOL_URL_KO);
    // JS disabled would be ideal, but Playwright's page.goto already captures
    // the server-rendered HTML before hydration finishes; check via response body.
    const response = await page.request.get(TOOL_URL_KO);
    const html = await response.text();
    expect(html).toContain('바코드 생성 방법');
    expect(html).toContain('자주 묻는 질문');
    expect((html.match(/"@type":"FAQPage"/g) || []).length).toBe(1);
    expect((html.match(/"@type":"SoftwareApplication"/g) || []).length).toBe(1);
  });
});
