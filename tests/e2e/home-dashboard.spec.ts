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

    // Live ladder card is a locale-prefixed link; coming-soon cards are not links.
    const ladderLink = page.locator('a[href="/ko/tools/ladder"]');
    await expect(ladderLink).toHaveCount(1);
    await expect(page.getByText('사다리 타기')).toBeVisible();
    await expect(page.getByText('랜덤 추첨기')).toBeVisible();
    await expect(page.locator('[aria-disabled="true"]')).toHaveCount(6);
  });

  test('search narrows the grid and the empty state offers a reset', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    const search = page.locator('#tool-search');
    await search.fill('사다리');
    await expect(page.getByText('사다리 타기')).toBeVisible();
    await expect(page.getByText('랜덤 추첨기')).toHaveCount(0);

    await search.fill('존재하지않는도구zzz');
    await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
    await page.getByRole('button', { name: '다시 시작' }).click();
    await expect(page.getByText('랜덤 추첨기')).toBeVisible();
  });

  test('category filter narrows the grid and mirrors to the URL', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: '텍스트' }).click();
    await expect(page.getByText('글자 수 세기')).toBeVisible();
    await expect(page.getByText('사다리 타기')).toHaveCount(0);
    await expect(page).toHaveURL(/cat=text/);
  });

  test('clicking the ladder card navigates to its tool page', async ({ page }) => {
    await page.goto('/ko');
    await page.waitForLoadState('networkidle');
    await page.locator('a[href="/ko/tools/ladder"]').click();
    await expect(page).toHaveURL(/\/ko\/tools\/ladder$/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('english locale renders English copy with lang="en"', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toContainText('Handy tools');
    await expect(page.getByText('Ladder Game')).toBeVisible();
    await expect(page.locator('a[href="/en/tools/ladder"]')).toHaveCount(1);
  });
});
