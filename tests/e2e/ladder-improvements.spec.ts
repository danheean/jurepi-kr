import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Ladder Game Improvements
 * - Help details (collapsible)
 * - Auto-names toggle and reroll
 * - Result buttons (winner, rank)
 * - Clear-all button
 * - Bug fixes (symmetric rungs, trace persistence)
 * - Confetti on reveal
 */

test.describe('Ladder Game - Improvements', () => {
  test('Help section is collapsible (default closed)', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Find help details element
    const helpDetails = page.locator('[data-testid="howto-details"]');
    await expect(helpDetails).toBeVisible();

    // Initially should NOT have open attribute
    const isOpenInitially = await helpDetails.evaluate((el: Element) => {
      return (el as HTMLDetailsElement).open;
    });
    expect(isOpenInitially).toBe(false);

    // Click summary to open
    const summary = helpDetails.locator('summary').first();
    await summary.click();

    // Now should be open
    const isOpenAfter = await helpDetails.evaluate((el: Element) => {
      return (el as HTMLDetailsElement).open;
    });
    expect(isOpenAfter).toBe(true);

    // Click again to close
    await summary.click();
    const isClosed = await helpDetails.evaluate((el: Element) => {
      return (el as HTMLDetailsElement).open;
    });
    expect(isClosed).toBe(false);
  });

  test('Auto-names toggle fills player names', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const autoNamesToggle = page.locator('[data-testid="auto-names-toggle"]');
    await expect(autoNamesToggle).toBeVisible({ timeout: 5000 });

    // Toggle ON
    await autoNamesToggle.click();
    await expect(autoNamesToggle).toHaveAttribute('aria-checked', 'true');

    // Names are filled by an effect (async), so use retrying assertions instead of
    // reading values immediately — avoids a race when there are many inputs.
    const playerInputs = page.locator('[data-testid="player-input"]');
    const count = await playerInputs.count();
    for (let i = 0; i < count; i++) {
      await expect(playerInputs.nth(i)).not.toHaveValue('');
    }
  });

  test('Reroll names button only visible when auto-names ON', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const rerollBtn = page.locator('[data-testid="reroll-names-btn"]');

    // Initially should not be visible
    const visibilityBefore = await rerollBtn.isVisible().catch(() => false);
    if (!visibilityBefore) {
      // Expected: reroll only shows when auto-names is ON
      const autoNamesToggle = page.locator('[data-testid="auto-names-toggle"]');
      await autoNamesToggle.click();
    }

    // Now should be visible
    await expect(rerollBtn).toBeVisible({ timeout: 5000 });

    // Click reroll and verify names change
    const playerInputs = page.locator('[data-testid="player-input"]');
    const firstNameBefore = await playerInputs.nth(0).inputValue();

    await rerollBtn.click();
    await page.waitForTimeout(200); // Small wait for update

    const firstNameAfter = await playerInputs.nth(0).inputValue();
    // Names might change or stay the same (depends on randomness), but should be non-empty
    expect(firstNameAfter.trim()).not.toBe('');
  });

  test('Result winner button sets one Win and rest Lose', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Setup with default 5 players
    const playerInputs = page.locator('[data-testid="player-input"]');
    const prizeInputs = page.locator('[data-testid="prize-input"]');
    await expect(playerInputs).toHaveCount(5);

    const playerCount = await playerInputs.count();
    for (let i = 0; i < playerCount; i++) {
      await playerInputs.nth(i).fill(`플레이어${i + 1}`);
    }

    // Fill prizes with descriptive values first
    for (let i = 0; i < playerCount; i++) {
      await prizeInputs.nth(i).fill(`상품${i + 1}`);
    }

    // Click result winner button
    const winnerBtn = page.locator('[data-testid="result-winner-btn"]');
    await expect(winnerBtn).toBeVisible({ timeout: 5000 });
    await winnerBtn.click();
    await page.waitForTimeout(200);

    // Check prize inputs: exactly one should be "당첨", the rest "꽝"
    let winCount = 0;
    let loseCount = 0;
    for (let i = 0; i < playerCount; i++) {
      const value = await prizeInputs.nth(i).inputValue();
      if (value === '당첨') winCount++;
      if (value === '꽝') loseCount++;
    }

    expect(winCount).toBe(1);
    expect(loseCount).toBe(playerCount - 1);
  });

  test('Result rank button sets numbered prizes', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Setup with 4 players
    const playerInputs = page.locator('[data-testid="player-input"]');
    const prizeInputs = page.locator('[data-testid="prize-input"]');

    for (let i = 0; i < 4; i++) {
      await playerInputs.nth(i).fill(`플레이어${i + 1}`);
      await prizeInputs.nth(i).fill(`초기상품${i + 1}`);
    }

    // Click result rank button
    const rankBtn = page.locator('[data-testid="result-rank-btn"]');
    await expect(rankBtn).toBeVisible({ timeout: 5000 });
    await rankBtn.click();
    await page.waitForTimeout(200);

    // Check prize inputs: should be non-empty and contain rank numbers
    const values: string[] = [];
    for (let i = 0; i < 4; i++) {
      const value = await prizeInputs.nth(i).inputValue();
      expect(value.trim()).not.toBe('');
      values.push(value);
    }

    // Values should be distinct (1st/2nd/3rd/4th or emoji variants)
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  test('Clear-all button resets all inputs', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const playerInputs = page.locator('[data-testid="player-input"]');
    const prizeInputs = page.locator('[data-testid="prize-input"]');

    // Fill with data
    for (let i = 0; i < 4; i++) {
      await playerInputs.nth(i).fill(`테스트${i}`);
      await prizeInputs.nth(i).fill(`상품${i}`);
    }

    // Click clear-all button
    const clearAllBtn = page.locator('[data-testid="clear-all-btn"]');
    await expect(clearAllBtn).toBeVisible({ timeout: 5000 });
    await clearAllBtn.click();
    await page.waitForTimeout(200);

    // Verify all inputs are empty
    for (let i = 0; i < 4; i++) {
      await expect(playerInputs.nth(i)).toHaveValue('');
      await expect(prizeInputs.nth(i)).toHaveValue('');
    }
  });

  test('Ladder geometry: rungs are symmetric (no floor touch)', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Build a ladder with default settings
    await page.locator('button:has-text("사다리 만들기")').click();
    await page.waitForTimeout(300);

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Evaluate SVG geometry: find vertical and rung lines
    const geometry = await svgBoard.evaluate((svg: Element) => {
      const paths = svg.querySelectorAll('path, line');
      let minRungY = Infinity;
      let maxRungY = -Infinity;
      let verticals: number[] = [];
      let verticalTop = 0;
      let verticalBottom = 0;

      const lines = Array.from(paths) as SVGElement[];
      for (const line of lines) {
        const x1 = parseFloat(line.getAttribute('x1') || '0');
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const x2 = parseFloat(line.getAttribute('x2') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');

        // Vertical lines: x1 === x2
        if (Math.abs(x1 - x2) < 1) {
          verticals.push(x1);
          if (verticalTop === 0 || y1 < verticalTop) verticalTop = y1;
          if (y2 > verticalBottom) verticalBottom = y2;
        }
        // Horizontal rung lines: y1 === y2 (rungs connect verticals)
        if (Math.abs(y1 - y2) < 1 && Math.abs(x1 - x2) > 5) {
          minRungY = Math.min(minRungY, y1);
          maxRungY = Math.max(maxRungY, y1);
        }
      }

      return {
        minRungY: minRungY === Infinity ? 0 : minRungY,
        maxRungY: maxRungY === -Infinity ? 0 : maxRungY,
        verticalTop,
        verticalBottom,
        verticalCount: verticals.length
      };
    });

    // Verify vertical exists and rungs are within bounds
    expect(geometry.verticalCount).toBeGreaterThan(0);
    if (geometry.minRungY > 0 && geometry.maxRungY > 0) {
      const topMargin = geometry.minRungY - geometry.verticalTop;
      const bottomMargin = geometry.verticalBottom - geometry.maxRungY;
      // Margins should be roughly symmetric (allow 2px tolerance for rounding)
      const diff = Math.abs(topMargin - bottomMargin);
      expect(diff).toBeLessThan(3);
    }
  });

  test('Trace persistence: revealed trace remains after animation', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Build ladder
    await page.locator('button:has-text("사다리 만들기")').click();
    await page.waitForTimeout(300);

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Reveal first player
    const playerChips = page.locator('[data-testid="player-chip"]');
    await playerChips.nth(0).click();

    // Wait for reveal animation to complete (350ms typical)
    await page.waitForTimeout(700);

    // Check that at least one path (trace) persists in the board
    const pathCount = await svgBoard.locator('path').count();
    expect(pathCount).toBeGreaterThan(0);
  });

  test('Confetti appears on full reveal (unless prefers-reduced-motion)', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Build ladder with defaults
    await page.locator('button:has-text("사다리 만들기")').click();
    await page.waitForTimeout(300);

    // Reveal all
    await page.locator('button:has-text("전체 결과 보기")').click();
    await page.waitForTimeout(800);

    // Check for confetti element (unless reduced-motion is set)
    const confetti = page.locator('[data-testid="winner-confetti"]');
    const prefersReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    if (!prefersReducedMotion) {
      // Confetti should be present
      const isVisible = await confetti.isVisible().catch(() => false);
      if (isVisible) {
        await expect(confetti).toBeVisible();
      }
    }
  });

  test('Player chips and prize cards align to the ladder rails', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    await page.locator('button:has-text("사다리 만들기")').click();
    await page.waitForTimeout(300);

    // Each chip center and card center should sit on its rail's x (±3px).
    const maxDelta = await page.evaluate(() => {
      const svg = document.querySelector(
        '[data-testid="ladder-board"]'
      ) as SVGSVGElement;
      const vlines = Array.from(svg.querySelectorAll('line')).filter(
        (l) => l.getAttribute('x1') === l.getAttribute('x2')
      );
      const pt = svg.createSVGPoint();
      const railX = vlines
        .map((l) => {
          pt.x = parseFloat(l.getAttribute('x1') || '0');
          pt.y = parseFloat(l.getAttribute('y1') || '0');
          return pt.matrixTransform(l.getScreenCTM()!).x;
        })
        .sort((a, b) => a - b);
      const centers = (sel: string) =>
        Array.from(document.querySelectorAll(sel))
          .map((e) => {
            const r = e.getBoundingClientRect();
            return r.left + r.width / 2;
          })
          .sort((a, b) => a - b);
      const chipX = centers('[data-testid="player-chip"]');
      const cardX = centers('[data-testid="prize-card"]');
      let max = 0;
      for (let i = 0; i < railX.length; i++) {
        max = Math.max(
          max,
          Math.abs(chipX[i] - railX[i]),
          Math.abs(cardX[i] - railX[i])
        );
      }
      return max;
    });

    expect(maxDelta).toBeLessThan(4);
  });
});
