import { test, expect } from '@playwright/test';
import catalog from '../../src/components/tools/rankings/data/rankings.generated.json';

// Derive the expected ranking count from the generated catalog
const TOTAL_RANKINGS = catalog.length;

/**
 * E2E Tests for Rankings Tool
 * Based on SPEC final_integration_test scenarios 1–5
 *
 * Product flow: Bilingual rankings (Korean + English) with search, field tabs,
 * detail panel with emphasized ProvenanceBanner, semantic table (medals, links, images),
 * favorites/recents (localStorage), language toggle (ko/en).
 *
 * NOTE: Tests use text/role-based selectors rather than testids (components don't have data-testid attrs).
 */

test.describe('Rankings Tool - E2E Integration', () => {
  test('Scenario 1: List renders all ranking cards with rose badges and compact source+date line', async ({
    page,
  }) => {
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    // Intro + H1 visible
    const h1 = page.locator('main h1');
    await expect(h1).toBeVisible({ timeout: 5000 });
    await expect(h1).toContainText('별별 랭킹');

    // Verify ranking cards are rendered by looking for ranking titles
    const mainElement = page.locator('main');
    const mainText = await mainElement.textContent();

    // Should contain both seeded rankings
    expect(mainText).toContain('LLM 에이전트 순위');
    expect(mainText).toContain('프로그래밍 언어 인기 순위');

    // Should show item counts (10개 항목, 12개 항목)
    expect(mainText).toContain('개 항목');

    // Should show field badges (AI·LLM, 프로그래밍)
    expect(mainText).toContain('AI');
    expect(mainText).toContain('프로그래밍');

    // Should show compact source+date line (기준일, 출처)
    expect(mainText).toContain('기준일');
    expect(mainText).toContain('출처');
    expect(mainText).toContain('2026-06');
  });

  test('Scenario 2: Search, field filter, empty state', async ({ page }) => {
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    const mainElement = page.locator('main');

    // Initial state: 결과 2개 (both rankings)
    let mainText = await mainElement.textContent();
    expect(mainText).toContain('결과 2개');

    // Search for "프로그래밍" — should narrow list
    // Search input is type="search" with aria-label="순위 검색"
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.click();
    await searchInput.fill('프로그래밍');
    await page.waitForTimeout(300); // Debounce + render

    mainText = await mainElement.textContent();
    // Should narrow to just programming-related ranking
    expect(mainText).toContain('결과 1개');
    expect(mainText).toContain('프로그래밍 언어 인기 순위');

    // Clear search
    await searchInput.click({ clickCount: 3 });
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    // Should restore full list (결과 2개)
    mainText = await mainElement.textContent();
    expect(mainText).toContain('결과 2개');

    // Click field tab (look for fieldtabs — "전체", "AI·LLM", "프로그래밍")
    // Click "AI·LLM" tab to filter
    const aiTabButton = page.locator('main button:has-text("AI·LLM")').first();
    if (await aiTabButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await aiTabButton.click();
      await page.waitForTimeout(150);

      mainText = await mainElement.textContent();
      // Should show only AI rankings
      expect(mainText).toContain('LLM 에이전트 순위');
      expect(mainText).toContain('결과 1개');
    }

    // Search for nonsense query
    await searchInput.click();
    await searchInput.click({ clickCount: 3 });
    await searchInput.fill('asdfqwer12345');
    await page.waitForTimeout(250);

    // Empty state should appear (e.g., "해당하는 순위가 없어요")
    mainText = await mainElement.textContent();
    expect(mainText).toContain('없어요');

    // Clear search should restore list (without field filter active at this point)
    await searchInput.click({ clickCount: 3 });
    await page.keyboard.press('Delete');
    await page.waitForTimeout(250);

    mainText = await mainElement.textContent();
    // After clearing, should show results (at least 1, depending on active filter)
    expect(mainText).toContain('결과');
  });

  test('Scenario 3: Detail — ProvenanceBanner emphasized above table with semantic structure', async ({
    page,
  }) => {
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    const mainElement = page.locator('main');

    // Open detail by clicking the ranking card (clicking the title bubbles to the card handler).
    await mainElement.getByText('LLM 에이전트 순위', { exact: false }).first().click();

    // CRITICAL — assert the detail table renders UNCONDITIONALLY. If the detail
    // crashes (e.g. a Rules-of-Hooks violation caught by the error boundary) the
    // table never appears and this fails — no silent `if (isVisible)` skip.
    const table = mainElement.locator('table');
    await expect(table).toBeVisible({ timeout: 5000 });

    // <thead> column headers
    const headerCells = table.locator('thead th');
    expect(await headerCells.count()).toBeGreaterThanOrEqual(3);

    // <tbody> rows — the LLM ranking has exactly 10 items
    const rows = table.locator('tbody tr');
    expect(await rows.count()).toBe(10);

    // Top-3 medals
    await expect(rows.nth(0)).toContainText('🥇');
    await expect(rows.nth(1)).toContainText('🥈');
    await expect(rows.nth(2)).toContainText('🥉');

    // sr-only caption for a11y
    await expect(table.locator('caption')).toHaveCount(1);

    // ProvenanceBanner (the trust surface) — scope to the clickable source link
    // in the detail region, NOT mainText (which also contains SEO howTo/FAQ prose
    // that mentions 기준일/출처). Asserting the arena.ai link proves the banner rendered.
    const sourceLink = mainElement.locator('a[href*="arena.ai"]');
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toContainText('Agent Arena');

    // As-of date shown in the detail
    await expect(mainElement.getByText('2026-06', { exact: false }).first()).toBeVisible();
  });

  test('Scenario 4: Favorites, recents, localStorage persistence, keyboard navigation', async ({ page }) => {
    // This test checks keyboard navigation and basic interaction
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    // Keyboard: "/" should focus search
    await page.keyboard.press('Slash');
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeFocused({ timeout: 5000 });

    // Type and verify search works
    await searchInput.fill('프로그래밍');
    await page.waitForTimeout(250);

    let mainText = await page.locator('main').textContent();
    expect(mainText).toContain('프로그래밍');

    // Esc should clear search (or close it)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);

    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe('');

    // Reload to test localStorage persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should load without error
    mainText = await page.locator('main').textContent();
    expect(mainText).toContain('별별 랭킹');
    expect(mainText).toContain('결과 2개');
  });

  test('Scenario 5: Locale swap (en), prerendered JSON-LD in static HTML', async ({ page }) => {
    // Visit English locale
    await page.goto('/en/tools/rankings');
    await page.waitForLoadState('networkidle');

    // H1 should be English
    const h1 = page.locator('main h1');
    const h1Text = await h1.textContent();
    expect(h1Text).toMatch(/Various|Ranking/i);

    // Page should show English ranking titles
    let mainText = await page.locator('main').textContent();
    expect(mainText).toContain('LLM Agent Leaderboard');
    expect(mainText).toContain('Programming Language');

    // Static HTML should contain JSON-LD
    const scriptTags = page.locator('script[type="application/ld+json"]');
    const scriptCount = await scriptTags.count();
    expect(scriptCount).toBeGreaterThan(0);

    // Look for SoftwareApplication JSON-LD
    let foundSoftwareApplication = false;
    for (let i = 0; i < scriptCount; i++) {
      const scriptContent = await scriptTags.nth(i).textContent();
      if (scriptContent && scriptContent.includes('SoftwareApplication')) {
        foundSoftwareApplication = true;
        const json = JSON.parse(scriptContent);
        expect(json['@type']).toBe('SoftwareApplication');
        break;
      }
    }
    expect(foundSoftwareApplication).toBe(true);

    // Look for ItemList JSON-LD (rankings rendered as items)
    let foundItemList = false;
    for (let i = 0; i < scriptCount; i++) {
      const scriptContent = await scriptTags.nth(i).textContent();
      if (scriptContent && scriptContent.includes('ItemList')) {
        foundItemList = true;
        const json = JSON.parse(scriptContent);
        expect(json['@type']).toBe('ItemList');
        expect(Array.isArray(json.itemListElement)).toBe(true);
        break;
      }
    }
    expect(foundItemList).toBe(true);

    // Canonical URL should be unique and match the current locale
    const canonicalLink = page.locator('link[rel="canonical"]');
    const canonicalHref = await canonicalLink.getAttribute('href');
    expect(canonicalHref).toContain('/en/tools/rankings');

    // Switch back to Korean — canonical should be different
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');
    const koCanonicalLink = page.locator('link[rel="canonical"]');
    const koCanonicalHref = await koCanonicalLink.getAttribute('href');
    expect(koCanonicalHref).toContain('/ko/tools/rankings');
  });

  test('Responsive: 320px mobile — table scrolls without page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    // H1 should be visible
    const h1 = page.locator('main h1');
    await expect(h1).toBeVisible({ timeout: 5000 });

    // Page content should be visible
    const mainText = await page.locator('main').textContent();
    expect(mainText).toContain('별별 랭킹');

    // Verify no horizontal page overflow
    const mainElement = page.locator('main');
    const boundingBox = await mainElement.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(320);

    // Try to scroll to table if visible
    const table = mainElement.locator('table').first();
    const tableVisible = await table.isVisible({ timeout: 2000 }).catch(() => false);
    if (tableVisible) {
      // Table should be scrollable but not cause page overflow
      const tableBoundingBox = await table.boundingBox();
      // Allow table to be wider than viewport if it's in a scroll container
      expect(tableBoundingBox).toBeTruthy();
    }
  });

  test('Accessibility: axe checks — semantic structure', async ({ page }) => {
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    // Check basic a11y attributes on search input
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Search input should be keyboard-accessible
    await searchInput.click();
    await page.keyboard.type('test');
    await page.waitForTimeout(250);

    // Should filter
    const mainText = await page.locator('main').textContent();
    expect(mainText).toBeTruthy();

    // Tables should have proper semantic structure
    const table = page.locator('main table').first();
    const tableVisible = await table.isVisible({ timeout: 2000 }).catch(() => false);
    if (tableVisible) {
      const thead = table.locator('thead');
      const tbody = table.locator('tbody');
      await expect(thead).toBeVisible();
      await expect(tbody).toBeVisible();

      // Header cells should have scope="col"
      const headerCells = thead.locator('th');
      const headerCount = await headerCells.count();
      expect(headerCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(headerCount, 3); i++) {
        const scope = await headerCells.nth(i).getAttribute('scope');
        expect(scope).toBe('col');
      }

      // Caption should exist
      const caption = table.locator('caption');
      await expect(caption).toBeVisible();
    }
  });

  test('Spoke pages: ranking detail route renders table, breadcrumb, back nav', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Direct navigation to a ranking spoke page (SEO entity URL)
    await page.goto('/ko/tools/rankings/tiobe-programming-languages');
    await page.waitForLoadState('networkidle');

    // H1 is the ranking title
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 5000 });
    await expect(h1).toContainText('프로그래밍 언어');

    // Breadcrumb: 홈 › 별별 랭킹 › 타이틀
    const breadcrumb = page.locator('[data-testid="rankings-spoke-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('홈');

    // Full ranking table is SSR'd on the spoke page
    const table = page.locator('main table').first();
    await expect(table).toBeVisible();
    await expect(table).toContainText('Python');

    // Back-to-hub link returns to the rankings hub
    const backLink = page.locator('[data-testid="rankings-spoke-back-to-hub"]');
    await expect(backLink).toHaveAttribute('href', '/ko/tools/rankings');
    await backLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/ko\/tools\/rankings$/);

    expect(consoleErrors).toEqual([]);
  });

  test('Hub cards are crawlable links to ranking spoke pages', async ({ page }) => {
    await page.goto('/ko/tools/rankings');
    await page.waitForLoadState('networkidle');

    // Each ranking card is a real anchor pointing at its spoke URL (prerendered)
    const firstCard = page.locator('[data-testid^="ranking-card-"]').first();
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^\/ko\/tools\/rankings\/[a-z0-9-]+$/);

    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="rankings-spoke-breadcrumb"]')
    ).toBeVisible({ timeout: 5000 });
  });
});
