import { test, expect, type Page } from '@playwright/test';

/**
 * Covers this branch's polish: the new hero headline + "request a tool" mailto
 * button, the share-button native title tooltips, and the copy-as-markdown
 * affordance on content spoke pages.
 */

async function openFirstHowtoGuide(page: Page): Promise<void> {
  await page.goto('/ko/tools/howto');
  const firstGuide = page.locator('main a[href*="/tools/howto/"]').first();
  await expect(firstGuide).toBeVisible();
  await firstGuide.click();
  await expect(page).toHaveURL(/\/tools\/howto\/[^/]+$/);
}

test.describe('Home + content affordances', () => {
  test('home hero shows the new headline and a mailto tool-request button', async ({ page }) => {
    await page.goto('/ko');

    await expect(page.locator('h1#hero-heading')).toHaveText('일상에 필요한 도구를 한곳에');

    const requestBtn = page.getByRole('link', { name: '도구 요청하기' });
    await expect(requestBtn).toBeVisible();
    const href = await requestBtn.getAttribute('href');
    expect(href).toContain('mailto:dhan0213@naver.com');
    expect(href).toContain('subject=');
  });

  test('share buttons expose a native title tooltip', async ({ page }) => {
    await openFirstHowtoGuide(page);

    const naver = page.locator('[data-testid="share-button-naver"]');
    await expect(naver).toBeVisible();
    await expect(naver).toHaveAttribute('title', '네이버로 공유 (블로그·카페)');
  });

  test('copy-as-markdown copies a document with title, source, and body', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await openFirstHowtoGuide(page);

    const copyBtn = page.getByTestId('copy-markdown-button');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Success feedback swaps the visible label
    await expect(copyBtn).toContainText(/마크다운을 복사했습니다|Markdown copied/, { timeout: 2000 });

    await page.waitForTimeout(200);
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => 'error'));
    expect(clip.startsWith('# ')).toBe(true);
    expect(clip).toContain('> 출처: ');
    expect(clip).toContain('/tools/howto/');
  });
});
