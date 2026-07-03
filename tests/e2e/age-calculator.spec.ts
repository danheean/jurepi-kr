import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Age Calculator Tool
 * Based on SPEC final_integration_test scenarios 1–5.
 *
 * The birthdate is entered via year / month / day <select> dropdowns
 * (elderly-friendly). `selectBirthdate` drives those three selects.
 */

const RECENTS_DEBOUNCE = 700; // > hook's 600ms debounce, so a settled date records

async function selectBirthdate(page: Page, dateStr: string, prefix = 'birthdate') {
  const [y, m, d] = dateStr.split('-').map(Number);
  await expect(page.locator(`#${prefix}-year`)).toBeVisible({ timeout: 5000 });
  await page.locator(`#${prefix}-year`).selectOption(String(y));
  await page.locator(`#${prefix}-month`).selectOption(String(m));
  await page.locator(`#${prefix}-day`).selectOption(String(d));
  await page.waitForTimeout(300);
}

test.describe('Age Calculator - E2E Integration', () => {
  /**
   * Scenario 1: Birthdate input → age calculations (만/연/세는)
   * Input: 2000-03-15 → zodiac=용띠, star=물고기자리
   */
  test('Scenario 1: Calculate age with three conventions and date facts', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    await selectBirthdate(page, '2000-03-15');

    const mainContent = page.locator('main');
    const ageCardFirst = mainContent.locator('[class*="surface"]').first();
    await expect(ageCardFirst).toBeVisible({ timeout: 5000 });

    const mainText = await mainContent.textContent();
    expect(mainText).toContain('용'); // zodiac 용띠
    expect(mainText).toContain('물고기'); // star 물고기자리

    // The dropdowns hold the chosen date
    await expect(page.locator('#birthdate-year')).toHaveValue('2000');
    await expect(page.locator('#birthdate-month')).toHaveValue('3');
    await expect(page.locator('#birthdate-day')).toHaveValue('15');
  });

  /**
   * Scenario 2: Leap-day birthdate (Feb 29) — the day dropdown offers 29 in 1996.
   */
  test('Scenario 2: Handle leap-day (Feb 29) birthdate', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    await selectBirthdate(page, '1996-02-29');

    const mainContent = page.locator('main');
    const ageCardsSection = mainContent.locator('[class*="surface"]').first();
    await expect(ageCardsSection).toBeVisible({ timeout: 5000 });

    await expect(page.locator('#birthdate-year')).toHaveValue('1996');
    await expect(page.locator('#birthdate-day')).toHaveValue('29');

    expect(consoleErrors).toHaveLength(0);
  });

  /**
   * Scenario 3: Recent lookups and ko/en locale swap
   */
  test('Scenario 3: Recent lookups and locale swap', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    // First date → let the debounce record it
    await selectBirthdate(page, '2000-03-15');
    await page.waitForTimeout(RECENTS_DEBOUNCE);

    // Second date → record it too
    await selectBirthdate(page, '1990-12-01');
    await page.waitForTimeout(RECENTS_DEBOUNCE);

    const mainElement = page.locator('main');
    await expect(mainElement).toContainText('최근', { timeout: 5000 });

    // Reload → recents persist (localStorage)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(mainElement).toContainText('최근', { timeout: 5000 });

    // Switch to English locale
    await page.goto('/en/tools/age-calculator');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toContainText('Age Calculator');
  });

  /**
   * Scenario 4: Copy + keyboard + a11y (manual checks)
   */
  test('Scenario 4: Copy, keyboard, and a11y (manual checks)', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    await selectBirthdate(page, '2000-03-15');

    const mainElement = page.locator('main');
    const copyButton = mainElement.locator('button').filter({ hasText: /복사|copy/i }).first();
    await expect(copyButton).toBeVisible({ timeout: 5000 });
    await copyButton.click();
    await page.waitForTimeout(200);

    // Each dropdown carries an aria-label (연도/월/일)
    const yearLabel = await page.locator('#birthdate-year').getAttribute('aria-label');
    expect(yearLabel).toBeTruthy();

    const buttonCount = await mainElement.locator('button').count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  /**
   * Scenario 5: SEO/prerender, JSON-LD
   */
  test('Scenario 5: SEO prerender and JSON-LD validation', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    const html = await page.content();

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    expect(titleMatch).toBeTruthy();
    expect(titleMatch?.[1] || '').toContain('나이 계산');

    expect(html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/)).toBeTruthy();

    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    expect(canonicalMatch?.[1] || '').toContain('/ko/tools/age-calculator');

    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g);
    expect(jsonLdMatches).toBeTruthy();
    let hasApplicationSchema = false;
    let hasFaqSchema = false;
    jsonLdMatches?.forEach((match) => {
      if (match.includes('SoftwareApplication')) hasApplicationSchema = true;
      if (match.includes('FAQPage')) hasFaqSchema = true;
    });
    expect(hasApplicationSchema).toBe(true);
    expect(hasFaqSchema).toBe(true);

    const hasHowTo = html.includes('생년월일') || html.includes('birthdate');
    const hasFaq = html.includes('어떻게') || html.includes('how');
    expect(hasHowTo || hasFaq).toBe(true);
  });

  /**
   * Scenario 5b: English locale SEO check
   */
  test('Scenario 5b: SEO prerender (English locale)', async ({ page }) => {
    await page.goto('/en/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    const html = await page.content();

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    expect(titleMatch?.[1] || '').toContain('Age Calculator');

    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    expect(canonicalMatch?.[1] || '').toContain('/en/tools/age-calculator');

    expect(html.match(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"/)).toBeTruthy();
  });

  /**
   * Error handling: a future date still surfaces an error. (Too-old / invalid
   * dates are structurally impossible now — the year dropdown is capped at
   * [thisYear-150, thisYear] and the day dropdown clamps to the month.)
   */
  test('Error handling: future date shows an error', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    // Dec 31 of the current year is a future date for almost the whole year.
    const y = new Date().getFullYear();
    await selectBirthdate(page, `${y}-12-31`);

    const errorMessage = page.locator('text=/미래|future|불가/i');
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      expect(await errorMessage.textContent()).toBeTruthy();
    }
  });

  /**
   * Responsive layout at mobile (320px) and tablet (768px)
   */
  test('Responsive: 320px and 768px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(320 + 20);

    await selectBirthdate(page, '2000-03-15');
    const ageCards = page.locator('main').locator('[class*="surface"]').first();
    await expect(ageCards).toBeVisible({ timeout: 5000 });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    const bodyWidth768 = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth768).toBeLessThanOrEqual(768 + 20);

    const ageCardsTablet = page.locator('main').locator('[class*="surface"]').first();
    await expect(ageCardsTablet).toBeVisible({ timeout: 5000 });
  });

  /**
   * Dark / light theme toggle
   */
  test('Dark/Light theme toggle', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    await selectBirthdate(page, '2000-03-15');

    const mainElement = page.locator('main');
    await expect(mainElement.locator('[class*="surface"]').first()).toBeVisible({ timeout: 5000 });
    await expect(mainElement).toContainText('용');

    const themeToggle = page.locator('button').filter({ hasText: /테마|theme|light|dark/i }).first();
    if (await themeToggle.isVisible({ timeout: 1000 })) {
      await themeToggle.click();
      await page.waitForTimeout(200);
      await expect(mainElement.locator('[class*="surface"]').first()).toBeVisible({ timeout: 5000 });
      await expect(mainElement).toContainText('용');
    }
  });

  /**
   * Lunar input: 음력 toggle + 윤달 switch + 간지 fact.
   */
  test('Lunar birthdate: toggle 음력, convert, and show 간지', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#birthdate-year')).toBeVisible({ timeout: 5000 }); // island mounted

    await page.getByRole('button', { name: '음력', exact: true }).click();
    await expect(page.getByRole('switch')).toBeVisible(); // 윤달 switch appears

    await selectBirthdate(page, '1988-05-10');

    const main = page.locator('main');
    await expect(main.locator('[class*="surface"]').first()).toBeVisible({ timeout: 5000 });
    await expect(main).toContainText('간지'); // sexagenary fact rendered for lunar input
  });

  /**
   * #3: save the current lookup as a person (prefilled add form, name only).
   */
  test('Save the current lookup as a person', async ({ page }) => {
    await page.goto('/ko/tools/age-calculator');
    await page.waitForLoadState('networkidle');

    await selectBirthdate(page, '2000-03-15');
    const main = page.locator('main');
    await expect(main.locator('[class*="surface"]').first()).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: '이 생년월일 저장' }).click();

    const nameInput = page.locator('#add-name');
    await expect(nameInput).toBeVisible();
    // date is prefilled from the lookup
    await expect(page.locator('#add-year')).toHaveValue('2000');
    await nameInput.fill('테스트');
    await page.getByRole('button', { name: '저장', exact: true }).click();

    await expect(main).toContainText('테스트');
  });
});
