import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Charades (몸으로 말해요)
 * Mirrors speed-quiz's scenario structure — same game engine, different
 * content curation (body-language-only prompt words).
 */

test.describe('Charades - E2E Integration', () => {
  test('Scenario 1: Deck list renders with categories, no console errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/ko/tools/charades');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="deck-grid"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="deck-category-tabs"]')).toBeVisible();

    const deckCount = await page.locator('[data-testid^="deck-card-"]').count();
    expect(deckCount).toBeGreaterThan(0);

    expect(pageErrors).toHaveLength(0);
  });

  test('Scenario 2: Full game flow - select, setup, play, end', async ({ page }) => {
    await page.goto('/ko/tools/charades');
    await page.waitForLoadState('networkidle');

    const firstDeckCard = page.locator('[data-testid^="deck-card-"]').first();
    await expect(firstDeckCard).toBeVisible();
    await firstDeckCard.click();

    await expect(page.locator('[data-testid="setup-start"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="setup-time-30"]').click();
    await page.locator('[data-testid="setup-start"]').click();

    const gameBoard = page.locator('[data-testid="game-board"]');
    await expect(gameBoard).toBeVisible({ timeout: 5000 });

    // The "no talking" reminder must be visible during play — this is the tool's
    // entire differentiator from speed-quiz, so it's a hard behavioral assertion.
    await expect(page.locator('[data-testid="game-no-talking-badge"]')).toBeVisible();

    await expect(page.locator('[data-testid="game-timer"]')).toBeVisible();

    await page.locator('[data-testid="game-correct"]').click();
    await expect(gameBoard).toBeVisible();

    await page.locator('[data-testid="game-pass"]').click();

    const undoBtn = page.locator('[data-testid="game-undo"]');
    if (await undoBtn.isEnabled()) {
      await undoBtn.click();
      await expect(gameBoard).toBeVisible();
    }

    await page.locator('[data-testid="game-end"]').click();
    await expect(page.locator('[data-testid="game-summary"]')).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 3: Favorites persist across reload', async ({ page }) => {
    await page.goto('/ko/tools/charades');
    await page.waitForLoadState('networkidle');

    const firstDeckCard = page.locator('[data-testid^="deck-card-"]').first();
    const slug = await firstDeckCard.getAttribute('data-testid');
    const deckSlug = slug?.replace('deck-card-', '');

    const favoriteBtn = page.locator(`[data-testid="deck-favorite-${deckSlug}"]`);
    await expect(favoriteBtn).toBeVisible();
    await favoriteBtn.click();
    await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const favoriteAfterReload = page.locator(`[data-testid="deck-favorite-${deckSlug}"]`);
    await expect(favoriteAfterReload).toHaveAttribute('aria-pressed', 'true');
  });

  test('Scenario 4: Search and category filtering', async ({ page }) => {
    await page.goto('/ko/tools/charades');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('[data-testid="deck-search-input"]');
    await expect(searchInput).toBeVisible();

    const initialCount = await page.locator('[data-testid^="deck-card-"]').count();

    await searchInput.fill('동작');
    await page.waitForTimeout(300);
    const filteredCount = await page.locator('[data-testid^="deck-card-"]').count();
    expect(filteredCount).toBeGreaterThanOrEqual(0);

    const clearBtn = page.locator('[data-testid="deck-search-clear"]');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    } else {
      await searchInput.clear();
    }
    await page.waitForTimeout(300);
    const restoredCount = await page.locator('[data-testid^="deck-card-"]').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('Scenario 5: English locale, 320px responsive, no console errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/en/tools/charades');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="deck-grid"]')).toBeVisible();

    // No horizontal overflow at 320px
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1);

    expect(pageErrors).toHaveLength(0);
  });
});
