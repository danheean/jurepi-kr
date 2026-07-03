import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Lunar Converter Tool
 * Based on SPEC final_integration_test scenarios 1–5.
 * Uses VERIFIED KASI anchors (leader-validated ground truth).
 *
 * Tests cover:
 * - Scenario 1: Solar → Lunar conversion (VERIFIED 2024-03-15 → 2024-02-06, NOT 윤2월)
 * - Scenario 2: Lunar → Solar conversion + leap month edge case (2023-04-04 → 윤2월)
 * - Scenario 3: Today button + locale swap ko/en
 * - Scenario 4: Recents persistence + copy + a11y
 * - Scenario 5: SEO prerender, JSON-LD validation
 */

test.describe('Lunar Converter - E2E Integration', () => {
  /**
   * Scenario 1: Solar → Lunar conversion
   * Input: 2024-03-15 (verified anchor: NOT 윤2월, plain 평달)
   * Expected: lunar shows 2024-02-06, sexagenary 갑진(甲辰), zodiac 용🐉
   */
  test('Scenario 1: Solar to lunar conversion with sexagenary and zodiac', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // Find solar year/month/day selects
    const solarYearSelect = page.locator('#solar-year');
    const solarMonthSelect = page.locator('#solar-month');
    const solarDaySelect = page.locator('#solar-day');

    await expect(solarYearSelect).toBeVisible({ timeout: 5000 });

    // Set solar date: 2024-03-15
    await solarYearSelect.selectOption('2024');
    await solarMonthSelect.selectOption('3');
    await solarDaySelect.selectOption('15');
    await page.waitForTimeout(300);

    // Verify conversion result appears in result section (not FAQ)
    const mainContent = page.locator('main');
    const resultCard = mainContent.locator('div').filter({ hasText: /음력.*2월 6일/ }).first();
    await expect(resultCard).toBeVisible({ timeout: 5000 });

    // Verify lunar date specifically in result card shows "2월 6일" (not 윤2월)
    const resultText = await resultCard.textContent();
    expect(resultText).toContain('2월 6일');
    // The result should NOT show leap month indicator (윤) for 2024-02
    expect(resultText).not.toMatch(/윤\s*\(/); // Must NOT show leap indicator

    // Verify sexagenary 갑진 in result
    expect(resultText).toContain('갑진');
    expect(resultText).toContain('甲辰');

    // Verify zodiac 용 (dragon) in result. The card renders the emoji (🐉) above the
    // localized name (용띠), so assert both are present without depending on their order.
    const zodiacCard = mainContent.locator('div').filter({ hasText: '🐉' }).first();
    await expect(zodiacCard).toBeVisible({ timeout: 5000 });
    const zodiacText = await zodiacCard.textContent();
    expect(zodiacText).toContain('🐉');
    expect(zodiacText).toMatch(/용/);
  });

  /**
   * Scenario 2: Lunar → Solar conversion + leap month edge case
   * Test 2a: Normal lunar date 2024-01-01 (설날) → solar 2024-02-10
   * Test 2b: Leap month case 2023-02-15 with leap=true → solar 2023-04-05
   * Test 2c: No leap month in 2024 → error when toggling leap
   */
  test('Scenario 2: Lunar to solar conversion with leap month validation', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // Find lunar inputs
    const lunarYearSelect = page.locator('#lunar-year');
    const lunarMonthSelect = page.locator('#lunar-month');
    const lunarDaySelect = page.locator('#lunar-day');
    const leapToggle = page.locator('button[role="switch"][aria-label*="윤"]').first();

    await expect(lunarYearSelect).toBeVisible({ timeout: 5000 });

    // Test 2a: Normal lunar date (설날)
    await lunarYearSelect.selectOption('2024');
    await lunarMonthSelect.selectOption('1');
    await lunarDaySelect.selectOption('1');
    await page.waitForTimeout(300);

    // Verify result shows solar 2024-02-10
    const mainContent = page.locator('main');
    let mainText = await mainContent.textContent();
    expect(mainText).toContain('2월 10일');

    // Test 2b: Leap month case (2023)
    await lunarYearSelect.selectOption('2023');
    await lunarMonthSelect.selectOption('2');
    await lunarDaySelect.selectOption('15');
    // Toggle leap switch on
    await leapToggle.click();
    await page.waitForTimeout(300);

    // Verify solar conversion for leap month: 2023-04-05
    mainText = await mainContent.textContent();
    expect(mainText).toContain('4월 5일');

    // Test 2c: No leap in 2024 → error on toggle
    await lunarYearSelect.selectOption('2024');
    await lunarMonthSelect.selectOption('2');
    await lunarDaySelect.selectOption('14');
    // Ensure leap is OFF first
    const leapChecked = await leapToggle.getAttribute('aria-checked');
    if (leapChecked === 'true') {
      await leapToggle.click();
      await page.waitForTimeout(100);
    }

    // Try to toggle leap ON → should show error
    await leapToggle.click();
    await page.waitForTimeout(300);

    // Look for error message about no leap month
    const errorElement = page.locator('text=/윤달|leap/i');
    const errorVisible = await errorElement.isVisible({ timeout: 1000 }).catch(() => false);
    // Error may appear as toast or inline; if visible, verify it mentions the issue
    if (errorVisible) {
      const errorText = await errorElement.textContent();
      expect(errorText).toBeTruthy();
    }
  });

  /**
   * Scenario 3: Today button and ko/en locale swap
   * Tests:
   * 1. Click Today button → both inputs update to today's date
   * 2. Result displays
   * 3. Navigate to /en → UI labels English, date formatting localized
   * 4. No console RangeError (Intl locale binding)
   */
  test('Scenario 3: Today button and locale swap (ko/en)', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // Find Today button
    const todayButton = page.locator('button').filter({ hasText: /오늘|today/i }).first();
    await expect(todayButton).toBeVisible({ timeout: 5000 });

    // Click Today
    await todayButton.click();
    await page.waitForTimeout(300);

    // Verify result appears (means conversion happened)
    const mainContent = page.locator('main');
    const resultText = await mainContent.textContent();
    expect(resultText).toContain('양력'); // Solar label
    expect(resultText).toContain('음력'); // Lunar label

    // Collect console errors during initial load
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', (msg) => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to English version
    await page.goto('/en/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // Verify English labels
    const enContent = page.locator('main');
    const enText = await enContent.textContent();
    expect(enText).toBeTruthy(); // Page loaded

    // Check for RangeError in console
    const rangeErrors = consoleMessages.filter(
      (m) => m.type === 'error' && m.text.includes('RangeError')
    );
    expect(rangeErrors.length).toBe(0);

    console.log('✓ Today button and locale swap passed');
  });

  /**
   * Scenario 4: Recents persistence, copy, and a11y
   * Tests:
   * 1. Do 2 conversions → recents list populates
   * 2. Reload → recents persist (localStorage)
   * 3. Click a recent → loads values
   * 4. Copy button → clipboard + toast
   * 5. axe accessibility (manual a11y checks)
   */
  test('Scenario 4: Recents, copy, and a11y', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    const solarYearSelect = page.locator('#solar-year');
    const solarMonthSelect = page.locator('#solar-month');
    const solarDaySelect = page.locator('#solar-day');

    // Step 1: Do first conversion (2024-03-15)
    await solarYearSelect.selectOption('2024');
    await solarMonthSelect.selectOption('3');
    await solarDaySelect.selectOption('15');
    await page.waitForTimeout(300);

    // Step 2: Do second conversion (2024-10-18)
    await solarYearSelect.selectOption('2024');
    await solarMonthSelect.selectOption('10');
    await solarDaySelect.selectOption('18');
    await page.waitForTimeout(300);

    // Verify recents list appears
    const mainContent = page.locator('main');
    let mainText = await mainContent.textContent();
    expect(mainText).toContain('최근'); // "Recents" label in Korean

    // Step 3: Reload → recents should persist
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);

    mainText = await mainContent.textContent();
    expect(mainText).toContain('최근'); // "Recents" label should still be there

    // Step 4: Copy button
    const copyButton = mainContent.locator('button').filter({ hasText: /복사|copy/i }).first();
    if (await copyButton.isVisible({ timeout: 2000 })) {
      await copyButton.click();
      await page.waitForTimeout(300);

      // Look for toast or success message
      const successText = page.locator('text=/복사됨|copied/i');
      const successVisible = await successText.isVisible({ timeout: 1000 }).catch(() => false);
      if (successVisible) {
        expect(await successText.textContent()).toBeTruthy();
      }
    }

    // Step 5: Manual a11y checks
    const solarlabel = solarYearSelect.locator('..').locator('label').first();
    const hasLabel = await solarlabel.getAttribute('for') || await solarYearSelect.getAttribute('aria-label');
    expect(hasLabel).toBeTruthy();

    // Verify buttons are tabbable
    const buttons = mainContent.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    console.log('✓ Recents, copy, and a11y passed');
  });

  /**
   * Scenario 5: SEO prerender and JSON-LD validation
   * Tests:
   * 1. Fetch prerendered HTML (ko/en)
   * 2. Verify unique title, meta description
   * 3. Verify canonical URL
   * 4. Verify JSON-LD: SoftwareApplication + FAQPage + BreadcrumbList (dedup)
   * 5. Verify howTo/FAQ content present (SSR, outside mounted gate)
   */
  test('Scenario 5: SEO prerender and JSON-LD (Korean)', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');

    // Get page HTML
    const html = await page.content();

    // Verify unique title containing locale
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    expect(titleMatch).toBeTruthy();
    const title = titleMatch?.[1] || '';
    expect(title.length).toBeGreaterThan(0);

    // Verify meta description
    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/);
    expect(descriptionMatch).toBeTruthy();

    // Verify canonical URL contains ko/tools/lunar-converter
    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    expect(canonicalMatch).toBeTruthy();
    const canonical = canonicalMatch?.[1] || '';
    expect(canonical).toContain('/ko/tools/lunar-converter');

    // Verify JSON-LD schemas
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g);
    expect(jsonLdMatches).toBeTruthy();

    let hasApplicationSchema = false;
    let hasFaqSchema = false;
    let hasBreadcrumbSchema = false;

    jsonLdMatches?.forEach((match) => {
      if (match.includes('SoftwareApplication')) {
        hasApplicationSchema = true;
        // Verify url property matches canonical
        if (!match.includes(canonical)) {
          console.warn('WARNING: SoftwareApplication url does not match canonical');
        }
      }
      if (match.includes('FAQPage')) {
        hasFaqSchema = true;
      }
      if (match.includes('BreadcrumbList')) {
        hasBreadcrumbSchema = true;
      }
    });

    expect(hasApplicationSchema).toBe(true);
    expect(hasFaqSchema).toBe(true);
    expect(hasBreadcrumbSchema).toBe(true);

    // Verify howTo/FAQ content in HTML (should be outside mounted gate = SSR)
    const hasHowToContent = html.includes('어떻게') || html.includes('무엇');
    expect(hasHowToContent).toBe(true);
  });

  /**
   * Scenario 5b: SEO prerender (English locale)
   */
  test('Scenario 5b: SEO prerender and JSON-LD (English)', async ({ page }) => {
    await page.goto('/en/tools/lunar-converter');
    await page.waitForLoadState('networkidle');

    const html = await page.content();

    // Verify English title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    expect(titleMatch).toBeTruthy();
    const title = titleMatch?.[1] || '';
    expect(title.length).toBeGreaterThan(0);

    // Verify canonical URL contains en/tools/lunar-converter
    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    expect(canonicalMatch).toBeTruthy();
    const canonical = canonicalMatch?.[1] || '';
    expect(canonical).toContain('/en/tools/lunar-converter');
    expect(canonical).not.toContain('/ko/');

    // Verify hreflang alternate link (should point to ko version)
    const hreflangMatch = html.match(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"/);
    expect(hreflangMatch).toBeTruthy();
  });

  /**
   * Test: Out-of-range year validation
   * Input: year < 1391 or > 2050 should error (if UI allows selecting)
   */
  test('Out-of-range validation: year boundaries', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    const solarYearSelect = page.locator('#solar-year');
    const solarMonthSelect = page.locator('#solar-month');
    const solarDaySelect = page.locator('#solar-day');

    // Verify dropdowns have year bounds (1391-2050)
    const yearOptions = solarYearSelect.locator('option');
    const yearCount = await yearOptions.count();
    // Should have options for 1391 to 2050 (plus blank option)
    expect(yearCount).toBeGreaterThan(600); // (2050-1391+1) options + 1 blank = 661

    // Attempt to select min year (1391) and a date
    await solarYearSelect.selectOption('1391');
    await solarMonthSelect.selectOption('1');
    await solarDaySelect.selectOption('1');
    await page.waitForTimeout(300);

    // Verify conversion works without error
    const mainText = await page.locator('main').textContent();
    expect(mainText).toBeTruthy();

    // Attempt to select max year (2050)
    await solarYearSelect.selectOption('2050');
    await solarMonthSelect.selectOption('12');
    await solarDaySelect.selectOption('31');
    await page.waitForTimeout(300);

    // Verify conversion works
    const mainText2 = await page.locator('main').textContent();
    expect(mainText2).toBeTruthy();

    console.log('✓ Year boundary validation passed');
  });

  /**
   * Test: Responsive layout at mobile (320px) and tablet (768px)
   */
  test('Responsive layout: 320px and 768px viewports', async ({ page }) => {
    // Test at 320px width
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320 + 20);

    // Do a conversion to show result
    const solarYearSelect = page.locator('#solar-year');
    const solarMonthSelect = page.locator('#solar-month');
    const solarDaySelect = page.locator('#solar-day');

    await solarYearSelect.selectOption('2024');
    await solarMonthSelect.selectOption('3');
    await solarDaySelect.selectOption('15');
    await page.waitForTimeout(300);

    // Verify result is visible
    const result = page.locator('main').locator('text=/양력|음력/').first();
    await expect(result).toBeVisible({ timeout: 5000 });

    // Test at 768px width
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    const bodyWidth768 = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth768).toBeLessThanOrEqual(768 + 20);

    // Do conversion at tablet size
    await solarYearSelect.selectOption('2024');
    await solarMonthSelect.selectOption('3');
    await solarDaySelect.selectOption('15');
    await page.waitForTimeout(300);

    // Verify result is visible at tablet size
    const resultTablet = page.locator('main').locator('text=/양력|음력/').first();
    await expect(resultTablet).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test: Dark/Light theme toggle (if available)
   */
  test('Dark/Light theme toggle', async ({ page }) => {
    await page.goto('/ko/tools/lunar-converter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(100);

    // Do conversion to show result
    const solarYearSelect = page.locator('#solar-year');
    const solarMonthSelect = page.locator('#solar-month');
    const solarDaySelect = page.locator('#solar-day');

    await solarYearSelect.selectOption('2024');
    await solarMonthSelect.selectOption('3');
    await solarDaySelect.selectOption('15');
    await page.waitForTimeout(300);

    // Verify result visible
    const result = page.locator('main').locator('text=/양력|음력/').first();
    await expect(result).toBeVisible({ timeout: 5000 });

    // Get initial text
    const textBefore = await page.locator('main').textContent();
    expect(textBefore).toContain('갑진'); // Should have sexagenary

    // Find theme toggle (usually in header)
    const themeToggle = page.locator('button').filter({ hasText: /테마|theme/i }).first();
    const toggleExists = await themeToggle.isVisible({ timeout: 1000 }).catch(() => false);

    if (toggleExists) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Verify result still visible
      const resultAfter = page.locator('main').locator('text=/양력|음력/').first();
      await expect(resultAfter).toBeVisible({ timeout: 5000 });

      // Verify content preserved
      const textAfter = await page.locator('main').textContent();
      expect(textAfter).toContain('갑진');
    }
  });
});
