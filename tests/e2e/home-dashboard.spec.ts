import { test, expect } from '@playwright/test';

/**
 * E2E for the main dashboard (home). Mirrors SPEC final_integration_test
 * scenario 1 (browse / filter / search / select) plus i18n + locale-prefixed
 * tool links. Selectors prefer roles/visible text over test ids.
 */

test.describe('Main dashboard - E2E', () => {
  test('home renders hero, mascot, and the full tool grid (ko)', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    // Exactly one H1, localized.
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('필요한 도구');

    // Mascot present with explicit dimensions (CLS-safe).
    const mascot = page.locator('img[alt*="마스코트"]').first();
    await expect(mascot).toBeVisible();

    // Scope to main content area (not footer which also renders tool links).
    const main = page.locator('main');

    // Live tools are linked; coming-soon cards are not links.
    const ladderLink = main.locator('a[href="/ko/tools/ladder"]');
    await expect(ladderLink).toHaveCount(1);
    await expect(main.getByText('사다리 타기')).toBeVisible();
    await expect(main.getByText('신조어 용어사전')).toBeVisible();
    // Note: aria-disabled="true" is for coming-soon cards; currently all tools are live.
    await expect(main.locator('[aria-disabled="true"]')).toHaveCount(0);
  });

  test('search narrows the grid and the empty state offers a reset', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    const search = page.locator('#tool-search');
    const main = page.locator('main');

    // Search for 'ladder' — should show only ladder, not other tools
    await search.fill('사다리');
    await expect(main.getByText('사다리 타기')).toBeVisible();
    await expect(main.getByText('신조어 용어사전')).toHaveCount(0);

    // Search for nonexistent tool — should show empty state
    await search.fill('존재하지않는도구zzz');
    await expect(main.getByText('검색 결과가 없어요')).toBeVisible();

    // Reset — should show all tools again
    await page.getByRole('button', { name: '다시 시작' }).click();
    await expect(main.getByText('신조어 용어사전')).toBeVisible();
  });

  test('category filter narrows the grid and mirrors to the URL', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');

    // Click text category — should show only text tools like new-word (신조어 용어사전)
    await page.getByRole('button', { name: '텍스트' }).click();
    await expect(main.getByText('신조어 용어사전')).toBeVisible();
    // Ladder is in random category, should not be visible
    await expect(main.getByText('사다리 타기')).toHaveCount(0);
    await expect(page).toHaveURL(/cat=text/);
  });

  test('clicking the ladder card navigates to its tool page', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await main.locator('a[href="/ko/tools/ladder"]').click();
    await expect(page).toHaveURL(/\/ko\/tools\/ladder$/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('english locale renders English copy with lang="en"', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Handy tools');
    await expect(main.getByText('Ladder Game')).toBeVisible();
    await expect(main.locator('a[href="/en/tools/ladder"]')).toHaveCount(1);
  });
});
