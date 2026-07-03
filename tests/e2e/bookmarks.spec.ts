import { test, expect } from '@playwright/test';

test.describe('Curated Bookmarks - E2E Integration', () => {
  test('Hub renders topic cards as crawlable spoke links', async ({ page }) => {
    await page.goto('/ko/tools/bookmarks');
    await page.waitForLoadState('networkidle');

    // Hub H1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 5000 });

    // Topic cards are prerendered anchors pointing at spoke URLs
    const cards = page.locator('[data-testid^="topic-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^\/ko\/tools\/bookmarks\/[a-z0-9-]+$/);
  });

  test('Spoke page renders sections, breadcrumb, links and back nav', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      // Ignore external thumbnail CDNs rate-limiting repeated test runs (429) — not an app defect
      if (msg.type() === 'error' && !/status of 429/.test(msg.text()))
        consoleErrors.push(msg.text());
    });

    await page.goto('/ko/tools/bookmarks/egovframe-standard');
    await page.waitForLoadState('networkidle');

    // H1 is the topic title
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 5000 });
    await expect(h1).toContainText('전자정부');

    // Breadcrumb: 홈 › 즐겨찾기 › 토픽
    const breadcrumb = page.locator('[data-testid="bookmarks-spoke-breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('홈');

    // Curated external links are SSR'd (crawlable) with rel safety
    const extLink = page
      .locator('main a[href^="https://"]')
      .filter({ hasNot: page.locator('[href*="apps.jurepi"]') })
      .first();
    await expect(extLink).toBeVisible();
    await expect(extLink).toHaveAttribute('rel', /noopener/);

    // Back-to-hub link returns to the bookmarks hub
    const backLink = page.locator('[data-testid="bookmarks-spoke-back-to-hub"]');
    await expect(backLink).toHaveAttribute('href', '/ko/tools/bookmarks');
    await backLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/ko\/tools\/bookmarks$/);

    expect(consoleErrors).toEqual([]);
  });

  test('Hub card navigates to its spoke page', async ({ page }) => {
    await page.goto('/ko/tools/bookmarks');
    await page.waitForLoadState('networkidle');

    const href = await page
      .locator('[data-testid^="topic-card-"]')
      .first()
      .getAttribute('href');
    expect(href).toBeTruthy();

    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="bookmarks-spoke-breadcrumb"]')
    ).toBeVisible({ timeout: 5000 });
  });
});
