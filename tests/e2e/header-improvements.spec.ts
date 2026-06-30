import { test, expect } from '@playwright/test';

const SHOT = '_workspace/screens-header';

// #1 — Bug reproduction: header search must work on a TOOL page (previously inert).
test('header search opens and lists tools on a tool page', async ({ page }) => {
  await page.goto('/ko/tools/ladder');
  await page.waitForLoadState('networkidle');

  const trigger = page.getByTestId('header-search');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const combobox = page.getByRole('combobox');
  await expect(combobox).toBeVisible();

  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();

  // Ladder (live) appears as an option linking to its page.
  const ladderOption = listbox.getByRole('option').filter({ hasText: '사다리' }).first();
  await expect(ladderOption).toBeVisible();

  // Coming-soon tools appear with a 준비중 badge.
  await expect(listbox.getByText('준비중').first()).toBeVisible();

  // Capture the open combobox for visual review.
  await page.screenshot({ path: `${SHOT}/01-search-open-toolpage-light.png` });

  // Width sanity: the input should be a usable width, not collapsed to the icon.
  const box = await combobox.boundingBox();
  console.log('COMBOBOX_WIDTH', JSON.stringify(box));
  expect.soft(box!.width).toBeGreaterThan(140);

  // Typing filters; '글자' should narrow to the word counter (ko keyword/name).
  await combobox.fill('사다리');
  await expect(listbox.getByRole('option').filter({ hasText: '사다리' }).first()).toBeVisible();
  // highlight <mark> present
  await expect(listbox.locator('mark').first()).toBeVisible();
});

// #2 — Locale active indicator.
test('locale switcher marks the current locale', async ({ page }) => {
  await page.goto('/ko');
  await expect(page.getByTestId('locale-ko')).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('locale-en')).not.toHaveAttribute('aria-current', 'true');

  await page.goto('/en');
  await expect(page.getByTestId('locale-en')).toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('locale-ko')).not.toHaveAttribute('aria-current', 'true');
});

// #3 — Theme 3-state cycle reflected in the toggle's aria-label.
test('theme toggle cycles through three labelled states', async ({ page }) => {
  await page.goto('/ko');
  const toggle = page.getByTestId('theme-toggle');
  const labels: string[] = [];
  for (let i = 0; i < 4; i++) {
    labels.push((await toggle.getAttribute('aria-label')) ?? '');
    await toggle.click();
  }
  console.log('THEME_LABELS', JSON.stringify(labels));
  const joined = labels.join('|');
  expect.soft(joined).toContain('라이트');
  expect.soft(joined).toContain('다크');
  expect.soft(joined).toContain('시스템');
});

// #4 — Category filter left edge aligns with the search box and grid.
test('category filter left-aligns with search and grid', async ({ page }) => {
  await page.goto('/ko');
  await page.waitForLoadState('networkidle');

  const searchInput = page.getByPlaceholder('도구 검색…').first();
  const firstPill = page.getByRole('button', { name: '전체' });
  const firstCard = page.locator('a[href="/ko/tools/ladder"]').first();

  const sb = await searchInput.boundingBox();
  const pb = await firstPill.boundingBox();
  const cb = await firstCard.boundingBox();
  console.log('ALIGN', JSON.stringify({ search: sb?.x, pill: pb?.x, card: cb?.x }));

  // All three left edges within 2px.
  expect.soft(Math.abs((pb!.x) - (sb!.x))).toBeLessThanOrEqual(2);
  expect.soft(Math.abs((pb!.x) - (cb!.x))).toBeLessThanOrEqual(2);

  await page.screenshot({ path: `${SHOT}/02-home-1440-light.png`, fullPage: false });
});

// Visual: home at mobile + dark theme.
test('visual snapshots — mobile and dark', async ({ page }) => {
  await page.goto('/ko');
  await page.waitForLoadState('networkidle');

  await page.setViewportSize({ width: 375, height: 800 });
  await page.screenshot({ path: `${SHOT}/03-home-375-light.png` });

  // Switch to dark (light -> dark is one click).
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByTestId('theme-toggle').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOT}/04-home-1440-dark.png` });
});
