import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Shuffle Results Feature
 * - Default 5 players
 * - Shuffle results toggle (instead of hide results)
 * - Download button gating (only in done phase)
 * - Prize cards always show '?' until revealed
 */

test.describe('Ladder Game - Shuffle Results', () => {
  test('Setup page has default 5 player input fields', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const playerInputs = page.locator('[data-testid="player-input"]');
    const count = await playerInputs.count();

    // Default should be 5 players
    expect(count).toBe(5);
  });

  test('Shuffle results toggle exists and is checked by default', async ({
    page,
  }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const shuffleToggle = page.locator('[data-testid="shuffle-results-toggle"]');
    await expect(shuffleToggle).toBeVisible();

    // Should be checked by default
    const isChecked = await shuffleToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('true');
  });

  test('Can toggle shuffle results on and off', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const shuffleToggle = page.locator('[data-testid="shuffle-results-toggle"]');

    // Toggle OFF
    await shuffleToggle.click();
    let isChecked = await shuffleToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('false');

    // Toggle ON
    await shuffleToggle.click();
    isChecked = await shuffleToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('true');
  });

  test('Prize cards show question marks before reveal', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Set minimal config and build
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/,
    });
    await buildButton.click();

    // Wait for ladder board
    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Prize cards should show '?'
    const prizeCards = page.locator('[data-testid="prize-card"]');
    const count = await prizeCards.count();
    expect(count).toBe(5); // Default 5 players

    // All cards should show '?'
    for (let i = 0; i < count; i++) {
      const text = await prizeCards.nth(i).textContent();
      expect(text?.trim()).toBe('?');
    }
  });

  test('Download button only appears in done phase', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Build ladder
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/,
    });
    await buildButton.click();

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Download button should NOT be visible in ready phase
    let downloadBtn = page.locator('[data-testid="download-btn"]');
    let isVisible = await downloadBtn.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    // Reveal all results
    const revealAllBtn = page.locator('button').filter({ hasText: /전체 결과 보기|Reveal all/ });
    await expect(revealAllBtn).toBeVisible();
    await revealAllBtn.click();

    // Now download button should be visible (done phase)
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });
  });

  test('Prize cards reveal on player click', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Set names and build
    const playerInputs = page.locator('[data-testid="player-input"]');
    await playerInputs.nth(0).fill('Alice');

    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/,
    });
    await buildButton.click();

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Click on a player chip to start trace
    const chips = page.locator('[data-testid="player-chip"]');
    await expect(chips.first()).toBeVisible({ timeout: 5000 });
    await chips.nth(0).click();

    // Wait for trace animation and reveal
    await page.waitForTimeout(1500);

    // At least one card should now be revealed (not all '?')
    const prizeCards = page.locator('[data-testid="prize-card"]');
    const count = await prizeCards.count();

    let hasReveal = false;
    for (let i = 0; i < count; i++) {
      const text = await prizeCards.nth(i).textContent();
      if (text?.trim() !== '?') {
        hasReveal = true;
        break;
      }
    }
    expect(hasReveal).toBe(true);
  });

  test('English version also has 5 players by default', async ({ page }) => {
    await page.goto('/en/tools/ladder');
    await page.waitForLoadState('networkidle');

    const playerInputs = page.locator('[data-testid="player-input"]');
    const count = await playerInputs.count();

    expect(count).toBe(5);
  });

  test.describe('Tension Control', () => {
    test('Tension control exists and defaults to high', async ({ page }) => {
      await page.goto('/ko/tools/ladder');
      await page.waitForLoadState('networkidle');

      const tensionControl = page.locator('[data-testid="tension-control"]');
      await expect(tensionControl).toBeVisible();

      const lowBtn = page.locator('[data-testid="tension-option-low"]');
      const mediumBtn = page.locator('[data-testid="tension-option-medium"]');
      const highBtn = page.locator('[data-testid="tension-option-high"]');

      await expect(lowBtn).toBeVisible();
      await expect(mediumBtn).toBeVisible();
      await expect(highBtn).toBeVisible();

      // High should be active by default
      const highPressed = await highBtn.getAttribute('aria-pressed');
      expect(highPressed).toBe('true');

      const lowPressed = await lowBtn.getAttribute('aria-pressed');
      const mediumPressed = await mediumBtn.getAttribute('aria-pressed');
      expect(lowPressed).toBe('false');
      expect(mediumPressed).toBe('false');
    });

    test('Can change tension and build ladders with different densities', async ({ page }) => {
      await page.goto('/ko/tools/ladder');
      await page.waitForLoadState('networkidle');

      // Step the count down from default 5 to 4 via the stepper buttons. At n=4 the
      // high-tension target (~8 rungs) always exceeds the max possible low-tension
      // rung count (6 inversions), so high > low is deterministic (no permutation-
      // variance flake). The Stepper uses +/- buttons, not a number input.
      const minusBtn = page.locator('[data-testid="stepper-decrement"]').first();
      await expect(minusBtn).toBeVisible({ timeout: 5000 });
      for (let i = 0; i < 1; i++) await minusBtn.click();

      // Build with LOW tension
      const lowBtn = page.locator('[data-testid="tension-option-low"]');
      await lowBtn.click();

      const buildButton = page.locator('button').filter({
        hasText: /사다리 만들기|Build/,
      });
      await buildButton.click();
      await page.waitForTimeout(300);

      const svgBoard = page.locator('[data-testid="ladder-board"]');
      await expect(svgBoard).toBeVisible();

      // Count horizontal lines (rungs) with low tension
      const rungsLow = await svgBoard.evaluate(() => {
        const svg = document.querySelector('[data-testid="ladder-board"]') as SVGSVGElement;
        const lines = Array.from(svg.querySelectorAll('line'));
        return lines.filter(l => {
          const y1 = parseFloat(l.getAttribute('y1') || '0');
          const y2 = parseFloat(l.getAttribute('y2') || '0');
          const x1 = parseFloat(l.getAttribute('x1') || '0');
          const x2 = parseFloat(l.getAttribute('x2') || '0');
          // Horizontal lines: y1 ≈ y2, x1 ≠ x2
          return Math.abs(y1 - y2) < 1 && Math.abs(x1 - x2) > 5;
        }).length;
      });

      expect(rungsLow).toBeGreaterThan(0);

      // Reset to setup and build with HIGH tension
      const resetBtn = page.locator('button').filter({ hasText: /처음으로|Reset/ });
      await expect(resetBtn).toBeVisible({ timeout: 5000 });
      await resetBtn.click();
      await page.waitForTimeout(300);

      const highBtn = page.locator('[data-testid="tension-option-high"]');
      await highBtn.click();

      await buildButton.click();
      await page.waitForTimeout(300);

      // Count horizontal lines with high tension
      const rungsHigh = await svgBoard.evaluate(() => {
        const svg = document.querySelector('[data-testid="ladder-board"]') as SVGSVGElement;
        const lines = Array.from(svg.querySelectorAll('line'));
        return lines.filter(l => {
          const y1 = parseFloat(l.getAttribute('y1') || '0');
          const y2 = parseFloat(l.getAttribute('y2') || '0');
          const x1 = parseFloat(l.getAttribute('x1') || '0');
          const x2 = parseFloat(l.getAttribute('x2') || '0');
          // Horizontal lines: y1 ≈ y2, x1 ≠ x2
          return Math.abs(y1 - y2) < 1 && Math.abs(x1 - x2) > 5;
        }).length;
      });

      // High tension should have more rungs (higher density) than low
      expect(rungsHigh).toBeGreaterThan(rungsLow);
    });

    test('Results still work correctly with different tension settings', async ({ page }) => {
      await page.goto('/ko/tools/ladder');
      await page.waitForLoadState('networkidle');

      // Set to medium tension
      const mediumBtn = page.locator('[data-testid="tension-option-medium"]');
      await mediumBtn.click();

      // Verify it's active
      const isActive = await mediumBtn.getAttribute('aria-pressed');
      expect(isActive).toBe('true');

      // Build
      const buildButton = page.locator('button').filter({
        hasText: /사다리 만들기|Build/,
      });
      await buildButton.click();
      await page.waitForTimeout(300);

      // Board should be visible
      const svgBoard = page.locator('[data-testid="ladder-board"]');
      await expect(svgBoard).toBeVisible();

      // Reveal all results
      const revealAllBtn = page.locator('button').filter({ hasText: /전체 결과 보기|Reveal all/ });
      await expect(revealAllBtn).toBeVisible();
      await revealAllBtn.click();
      await page.waitForTimeout(800);

      // All prize cards should be revealed (no '?')
      const prizeCards = page.locator('[data-testid="prize-card"]');
      const count = await prizeCards.count();

      for (let i = 0; i < count; i++) {
        const text = await prizeCards.nth(i).textContent();
        expect(text?.trim()).not.toBe('?');
      }
    });
  });
});
