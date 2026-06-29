import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Ladder Game (Ghost Leg)
 * Based on PRD final_integration_test scenarios.
 *
 * Product flow note: ResultPanel (전체 결과 보기 / 다시 섞기 / 처음으로 / 결과 복사)
 * renders only once at least one player has been revealed (PRD: "panel appears after
 * first reveal"). Reshuffle clears reveals, so the panel hides again until the next
 * reveal. These tests follow that real flow.
 */

const prizeCardsAllRevealed = async (cards: ReturnType<import('@playwright/test').Page['locator']>, n: number) => {
  let revealed = 0;
  for (let i = 0; i < n; i++) {
    const text = await cards.nth(i).textContent();
    if (text && text.trim() !== '?') revealed++;
  }
  return revealed;
};

test.describe('Ladder Game - E2E Integration', () => {
  test('Scenario 1: Full game with hidden results', async ({ page }) => {
    // Headless Chromium blocks navigator.clipboard.writeText without permission;
    // grant it so "결과 복사" hits the success path (toast) rather than the fallback.
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Setup card visible (default 4 players)
    const setupCard = page.locator('[data-testid="setup-card"]');
    await expect(setupCard).toBeVisible({ timeout: 5000 });

    // Increment player count 4 -> 6
    const plusButton = page.locator('[data-testid="stepper-increment"]').first();
    await expect(plusButton).toBeVisible({ timeout: 5000 });
    await plusButton.click();
    await plusButton.click();

    const playerInputs = page.locator('[data-testid="player-input"]');
    await expect(playerInputs).toHaveCount(6);

    const playerNames = ['민수', '영희', '철수', '지은', '현우', '수빈'];
    for (let i = 0; i < 6; i++) await playerInputs.nth(i).fill(playerNames[i]);

    const prizeInputs = page.locator('[data-testid="prize-input"]');
    const prizeNames = ['꽝', '커피', '꽝', '당첨', '꽝', '청소'];
    for (let i = 0; i < 6; i++) await prizeInputs.nth(i).fill(prizeNames[i]);

    // 결과 가리기 ON by default
    const hideToggle = page.locator('[data-testid="hide-results-toggle"]');
    expect(await hideToggle.getAttribute('aria-checked')).toBe('true');

    // Build
    await page.locator('button:has-text("사다리 만들기")').click();

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    const prizeCards = page.locator('[data-testid="prize-card"]');
    await expect(prizeCards).toHaveCount(6);
    for (let i = 0; i < 6; i++) await expect(prizeCards.nth(i)).toHaveText('?', { timeout: 5000 });

    // Reveal one player (영희)
    const playerChips = page.locator('[data-testid="player-chip"]');
    await playerChips.nth(1).click();
    await expect.poll(() => prizeCardsAllRevealed(prizeCards, 6), { timeout: 3000 }).toBeGreaterThan(0);

    // aria-live announcement region present
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();

    // Reveal all
    await page.locator('button:has-text("전체 결과 보기")').click();
    await expect.poll(() => prizeCardsAllRevealed(prizeCards, 6), { timeout: 8000 }).toBe(6);

    // Result summary shown (phase = done)
    await expect(page.locator('[data-testid="result-summary"]')).toBeVisible({ timeout: 5000 });

    // Copy results -> toast (prize labels intentionally contain duplicates like 꽝,
    // so we assert all 6 cards are revealed rather than unique label text).
    await page.locator('button:has-text("결과 복사")').click();
    await expect(page.locator('text=/복사되었습니다|Copied/')).toBeVisible({ timeout: 3000 });

    // Reshuffle: labels retained, reveals cleared (panel hides until next reveal)
    await page.locator('button:has-text("다시 섞기")').click();
    await expect.poll(async () => {
      let hidden = 0;
      for (let i = 0; i < 6; i++) if ((await prizeCards.nth(i).textContent())?.trim() === '?') hidden++;
      return hidden;
    }, { timeout: 3000 }).toBe(6);
    // Player names retained on chips after reshuffle
    for (let i = 0; i < 6; i++) {
      await expect(playerChips.nth(i)).toContainText(playerNames[i]);
    }

    // Reset stays available after reshuffle (product decision) — no re-reveal needed.
    const resetButton = page.locator('button:has-text("처음으로")');
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // Back to setup with labels retained
    await expect(setupCard).toBeVisible({ timeout: 5000 });
    const playerInputsAfterReset = page.locator('[data-testid="player-input"]');
    for (let i = 0; i < 6; i++) {
      await expect(playerInputsAfterReset.nth(i)).toHaveValue(playerNames[i]);
    }
  });

  test('Scenario 2: Visible-results mode + edge counts', async ({ page }) => {
    // Part A — visible mode: prizes shown immediately after build (no "?")
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');
    const hideToggle = page.locator('[data-testid="hide-results-toggle"]');
    await expect(hideToggle).toBeVisible({ timeout: 5000 });
    await hideToggle.click();
    expect(await hideToggle.getAttribute('aria-checked')).toBe('false');
    await page.locator('button:has-text("사다리 만들기")').click();
    const prizeCardsVis = page.locator('[data-testid="prize-card"]');
    await expect(prizeCardsVis).toHaveCount(4, { timeout: 5000 });
    for (let i = 0; i < 4; i++) {
      expect((await prizeCardsVis.nth(i).textContent())?.trim()).not.toBe('?');
    }

    // Part B — minimum count (fresh load; default 4 -> 2). Avoids reset (panel-only).
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');
    const minusButton = page.locator('[data-testid="stepper-decrement"]').first();
    await expect(minusButton).toBeVisible({ timeout: 5000 });
    await minusButton.click(); // 4 -> 3
    await minusButton.click(); // 3 -> 2
    await expect(minusButton).toBeDisabled();
    await page.locator('button:has-text("사다리 만들기")').click();
    await expect(page.locator('[data-testid="player-chip"]')).toHaveCount(2, { timeout: 5000 });

    // Part C — maximum count (fresh load; default 4 -> 10) + narrow-viewport overflow
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');
    const plusButton = page.locator('[data-testid="stepper-increment"]').first();
    await expect(plusButton).toBeVisible({ timeout: 5000 });
    for (let i = 0; i < 6; i++) await plusButton.click(); // 4 -> 10
    await expect(plusButton).toBeDisabled();
    await page.locator('button:has-text("사다리 만들기")').click();
    await expect(page.locator('[data-testid="player-chip"]')).toHaveCount(10, { timeout: 5000 });

    // Narrow viewport: the board scrolls internally; the PAGE must not overflow horizontally.
    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator('[data-testid="ladder-board"]')).toBeVisible();
    const noPageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1
    );
    expect(noPageOverflow).toBe(true);
  });

  test('Scenario 3: i18n, keyboard, reduced-motion', async ({ page }) => {
    // Test i18n - switch to English
    await page.goto('/en/tools/ladder');

    // Verify English UI
    const heading = page.locator('h1');
    const headingText = await heading.textContent();
    expect(headingText).toContain('Ladder Game');

    // Build a ladder with default 4 players
    const buildButton = page.locator('button:has-text("Build")');
    await buildButton.click();

    // Test keyboard shortcuts
    // Press "2" to reveal player at column 2
    await page.keyboard.press('2');

    // Verify one player has been revealed
    const prizeCards = page.locator('[data-testid="prize-card"]');
    await expect.poll(() => prizeCardsAllRevealed(prizeCards, 4), { timeout: 3000 }).toBeGreaterThan(0);

    // Press "a" to reveal all
    await page.keyboard.press('a');
    await expect.poll(() => prizeCardsAllRevealed(prizeCards, 4), { timeout: 5000 }).toBe(4);

    // "r" reshuffle button exists (Reshuffle visible while panel shown)
    const reshuffleButton = page.locator('button:has-text("Reshuffle")');
    await expect(reshuffleButton).toBeVisible();

    // Reduced-motion: page builds without error
    const browser = page.context().browser();
    if (browser) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const reducedMotionPage = await context.newPage();
      await reducedMotionPage.goto('/ko/tools/ladder');
      await reducedMotionPage.locator('button:has-text("사다리 만들기")').click();
      await expect(reducedMotionPage.locator('[data-testid="ladder-board"]')).toBeVisible();
      await reducedMotionPage.close();
      await context.close();
    }

    // aria-live region exists for announcements
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  });

  test('Smoke test: Home page loads', async ({ page }) => {
    await page.goto('/ko');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    expect(await heading.textContent()).toBeTruthy();

    const ladderLink = page.locator('a[href*="/tools/ladder"]');
    await expect(ladderLink).toBeVisible();
    await ladderLink.click();
    await page.waitForURL('**/tools/ladder');
    await expect(page).toHaveURL(/\/tools\/ladder/);
  });
});
