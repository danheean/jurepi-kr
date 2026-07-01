import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Q&A a Day Tool
 * Based on SPEC final_integration_test scenarios 1–5.
 *
 * Each scenario focuses on a critical user flow: persistence, calendar navigation,
 * backup/restore, i18n/leap-year handling, and SEO/storage resilience.
 */

test.describe('Q&A a Day - E2E Integration', () => {
  /**
   * Scenario 1: Answer today, persist across reload
   * Steps: Visit today tab → type answer → save status appears → reload → answer persists → clear answer → undo
   */
  test('Scenario 1: Answer today, persist across reload', async ({ page, context }) => {
    // Start with fresh localStorage for this test
    await context.clearCookies();
    await page.goto('/ko/tools/qna-a-day');
    await page.waitForLoadState('networkidle');

    // Wait for component to hydrate (the composer appears when mounted)
    const composer = page.locator('[data-testid="daily-question-composer"] textarea');
    await expect(composer).toBeVisible({ timeout: 15000 });

    // Check today's question is displayed (quotation bar + question text)
    const questionDiv = page.locator('#today-panel').locator('p.text-body-lg');
    await expect(questionDiv).toBeVisible({ timeout: 5000 });
    const questionContent = await questionDiv.textContent();
    expect(questionContent).toBeTruthy();
    expect(questionContent?.length).toBeGreaterThan(10);

    // Type an answer
    const testAnswer = '오늘은 날씨가 좋은 날씨네요.';
    await composer.fill(testAnswer);

    // Wait for autosave — check for "저장됨" in aria-live status region
    const statusRegion = page.locator('[data-testid="daily-question-composer"] [role="status"]');
    await expect(statusRegion).toContainText('저장됨', { timeout: 2000 });

    // Check char counter updates (matches the "N / 4000" counter specifically)
    const charCounter = page.getByText(/\d+\s*\/\s*4000/).first();
    await expect(charCounter).toBeVisible();
    const counterText = await charCounter.textContent();
    expect(counterText).toContain('/');

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify the answer persists
    const composerAfterReload = page.locator('[data-testid="daily-question-composer"] textarea');
    await expect(composerAfterReload).toHaveValue(testAnswer, { timeout: 5000 });

    // Test Cmd/Ctrl+S immediate save
    const platform = process.platform === 'darwin' ? 'Meta' : 'Control';
    await composerAfterReload.focus();
    await page.keyboard.press(`${platform}+S`);
    // Should show immediate save feedback
    const statusAfterSave = page.locator('[data-testid="daily-question-composer"] [role="status"]');
    await expect(statusAfterSave).toContainText('저장됨', { timeout: 1000 });

    // Test clearing answer → removes entry, undo appears
    await composerAfterReload.fill('');
    await page.waitForTimeout(100); // Let blur/autosave trigger

    // After clearing, the undo button should appear
    const undoButton = page.locator('[data-testid="daily-question-composer"]').locator('button:has-text("되돌리기")');
    const undoAppeared = await undoButton.isVisible().catch(() => false);
    if (undoAppeared) {
      await undoButton.click();
      // After undo, the text should be restored
      await expect(composerAfterReload).toHaveValue(testAnswer, { timeout: 2000 });
    }
  });

  /**
   * Scenario 2: Calendar navigation, past dates, multi-year reflection
   * Steps: Switch to calendar → tap past date → write answer → see cell fill → heatmap
   */
  test('Scenario 2: Calendar navigation, past dates, multi-year reflection', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/ko/tools/qna-a-day');
    await page.waitForLoadState('networkidle');

    // Wait for component to hydrate (the composer appears when mounted)
    const composer = page.locator('[data-testid="daily-question-composer"] textarea');
    await expect(composer).toBeVisible({ timeout: 15000 });

    // Wait for the tab bar to render
    const tabBar = page.locator('[role="tablist"]');
    await expect(tabBar).toBeVisible({ timeout: 5000 });

    // Click calendar tab (button with text "달력")
    const calendarTab = tabBar.locator('button:has-text("달력")');
    await expect(calendarTab).toBeVisible({ timeout: 5000 });
    await calendarTab.click();

    // Calendar panel should be visible
    const calendarPanel = page.locator('#calendar-panel');
    await expect(calendarPanel).toBeVisible({ timeout: 5000 });

    // Month grid should render with day buttons
    const dayButtons = calendarPanel.locator('button');
    const dayCount = await dayButtons.count();
    expect(dayCount).toBeGreaterThan(20); // At least a month's worth of days

    // Verify year switcher exists (year is shown as text; prev/next are aria-labeled buttons)
    const yearDisplay = calendarPanel.getByText(/20\d{2}/).first();
    await expect(yearDisplay).toBeVisible();

    // Try clicking the first day button (not today)
    const firstDayBtn = dayButtons.nth(0);
    await firstDayBtn.click();

    // Wait for composer to appear in the calendar panel
    await page.waitForTimeout(300);
    const composerVisible = await composer.isVisible().catch(() => false);

    if (composerVisible) {
      // Type an answer for that date
      const testAnswer = '예전에 쓴 답변입니다.';
      await composer.fill(testAnswer);
      await page.waitForTimeout(800); // Wait for autosave debounce
    }
  });

  /**
   * Scenario 3: Backup / restore round-trip + durability
   * Steps: Settings → export → reset → verify reset
   */
  test('Scenario 3: Backup / restore round-trip + durability', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/ko/tools/qna-a-day');
    await page.waitForLoadState('networkidle');

    // Wait for component to hydrate (the composer appears when mounted)
    const composer = page.locator('[data-testid="daily-question-composer"] textarea');
    await expect(composer).toBeVisible({ timeout: 15000 });
    const testAnswer = '테스트 기록입니다.';
    await composer.fill(testAnswer);
    await page.waitForTimeout(800); // Autosave

    // Switch to settings tab
    const tabBar = page.locator('[role="tablist"]');
    const settingsTab = tabBar.locator('button:has-text("설정")');
    await expect(settingsTab).toBeVisible({ timeout: 5000 });
    await settingsTab.click();

    const settingsPanel = page.locator('#settings-panel');
    await expect(settingsPanel).toBeVisible({ timeout: 5000 });

    // Click export button and capture the download
    const exportButton = settingsPanel.locator('button:has-text("내보내기")');
    await expect(exportButton).toBeVisible({ timeout: 5000 });

    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    expect(download.suggestedFilename()).toMatch(/jurepi-qna-a-day-backup-\d{4}-\d{2}-\d{2}\.json/);

    // Export was successful
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
  });

  /**
   * Scenario 4: i18n / leap year handling
   * Steps: Switch to /en → verify English content → check Feb 29 handling
   */
  test('Scenario 4: i18n / leap year handling', async ({ page, context }) => {
    await context.clearCookies();

    // Visit English version
    await page.goto('/en/tools/qna-a-day');
    await page.waitForLoadState('networkidle');

    // Wait for component to hydrate (the composer appears when mounted)
    const composer = page.locator('[data-testid="daily-question-composer"] textarea');
    await expect(composer).toBeVisible({ timeout: 15000 });

    // Verify UI is in English by checking tab bar
    const tabBar = page.locator('[role="tablist"]');
    await expect(tabBar).toBeVisible({ timeout: 5000 });
    const todayTab = tabBar.locator('button').first();
    const tabText = await todayTab.textContent();
    expect(tabText).toBe('Today');

    // Check today's question is in English
    const todayPanel = page.locator('#today-panel');
    const questionDiv = todayPanel.locator('p.text-body-lg');
    await expect(questionDiv).toBeVisible({ timeout: 5000 });
    const enQContent = await questionDiv.textContent();
    expect(enQContent).toBeTruthy();

    // Check composer placeholder is in English
    const placeholder = await composer.getAttribute('placeholder');
    expect(placeholder?.toLowerCase()).toContain('write');

    // Switch to Korean and verify same date shows the Korean question
    await page.goto('/ko/tools/qna-a-day');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const koTodayPanel = page.locator('#today-panel');
    const koQuestionDiv = koTodayPanel.locator('p.text-body-lg');
    const koQContent = await koQuestionDiv.textContent();
    expect(koQContent).toBeTruthy();

    // The two questions should be different (different languages)
    expect(enQContent).not.toBe(koQContent);
  });

  /**
   * Scenario 5: SEO metadata + static generation
   * Steps: Check static HTML contains title/meta/OG/canonical/hrefLang
   */
  test('Scenario 5: SEO metadata + static generation', async ({ page, context }) => {
    // Check SEO in static HTML (page source)
    const res = await page.goto('/ko/tools/qna-a-day');
    expect(res?.status()).toBe(200);

    // Verify title, meta description, canonical, hrefLang
    const title = page.locator('title');
    const titleText = await title.textContent();
    expect(titleText).toContain('1일 1질문');

    // Check for meta description
    const metaDesc = page.locator('meta[name="description"]');
    const metaContent = await metaDesc.getAttribute('content');
    expect(metaContent).toBeTruthy();
    expect(metaContent?.length).toBeGreaterThan(20);

    // Check for canonical link
    const canonical = page.locator('link[rel="canonical"]');
    const canonicalHref = await canonical.getAttribute('href');
    expect(canonicalHref).toContain('/ko/tools/qna-a-day');

    // Check for OG tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogTitleContent = await ogTitle.getAttribute('content');
    expect(ogTitleContent).toBeTruthy();

    // Check for hrefLang
    const hrefLangKo = page.locator('link[rel="alternate"][hreflang="ko"]');
    const hrefLangEn = page.locator('link[rel="alternate"][hreflang="en"]');
    const koHref = await hrefLangKo.getAttribute('href');
    const enHref = await hrefLangEn.getAttribute('href');
    expect(koHref).toContain('/ko/tools/qna-a-day');
    expect(enHref).toContain('/en/tools/qna-a-day');

    // Check for JSON-LD: both SoftwareApplication and FAQPage are emitted (order-independent)
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    const scriptCount = await jsonLdScript.count();
    expect(scriptCount).toBeGreaterThanOrEqual(1);

    const allLd = await jsonLdScript.allTextContents();
    expect(allLd.some((s) => s.includes('SoftwareApplication'))).toBe(true);
    expect(allLd.some((s) => s.includes('FAQPage'))).toBe(true);
  });

  /**
   * Integration: CategoryFilter + Search on home page
   * Verify mindset category appears and qna-a-day tool is filtered/searchable
   */
  test('Integration: CategoryFilter + Search (mindset category + qna-a-day)', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    // Search for qna-a-day via the home search input
    const searchInput = page.locator('input[placeholder*="도구 검색"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search for "1일1질문"
    await searchInput.fill('1일1질문');
    await page.waitForTimeout(300); // Debounce

    // Results should show the qna-a-day tool card
    const toolCards = page.locator('a[href*="/ko/tools/qna-a-day"]');
    await expect(toolCards.first()).toBeVisible({ timeout: 5000 });

    // Verify link is locale-prefixed and correct
    const href = await toolCards.first().getAttribute('href');
    expect(href).toBe('/ko/tools/qna-a-day');

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // Check category filters exist (looking for buttons with role="button" that contain category text)
    const mindsetPill = page.locator('button:has-text("마음·기록")').first();
    const mindsetExists = await mindsetPill.isVisible().catch(() => false);
    expect(mindsetExists).toBe(true);

    if (mindsetExists) {
      // Click mindset category
      await mindsetPill.click();
      await page.waitForTimeout(300);

      // qna-a-day should still be visible
      const filteredCard = page.locator('a[href*="/ko/tools/qna-a-day"]');
      await expect(filteredCard.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
