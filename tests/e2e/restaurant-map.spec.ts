import { test, expect, type Page } from '@playwright/test';

/**
 * 맛집 리스트 (restaurant-map) E2E.
 *
 * Regression context: production crashed with "TypeError: e.maxLat is not a
 * function" (invented NAVER Maps LatLngBounds API) — the ErrorBoundary
 * swallowed the whole tool. These specs fail on any uncaught page error or
 * boundary catch, so an SDK-API regression cannot hide behind green units.
 *
 * The NAVER SDK may legitimately fail to load in some environments (URL-
 * restricted key); the tool must then degrade to MapFailover — never to the
 * ErrorBoundary. Assertions therefore target the list/search/filter surface,
 * which must work regardless of map availability.
 *
 * Content: the live catalog is the single "서울 맛집" list (curator honey,
 * region seoul) with three korean places — 대광어회집 / 제주은희네해장국 을지로4가점 /
 * 성수족발. Specs assert against those places by name.
 */

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().includes('Error caught by boundary')) {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe('Restaurant Map - E2E', () => {
  test('tool loads without ErrorBoundary and interactive UI mounts (ko)', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    await page.waitForLoadState('networkidle');

    // SSR SEO surface
    await expect(page.locator('main h1').first()).toBeVisible();

    // Interactive SPA mounted: searchbox appears after hydration
    const search = page.getByRole('searchbox');
    await expect(search).toBeVisible({ timeout: 10_000 });

    // ErrorBoundary fallback must NOT be shown
    await expect(page.getByText('문제가 발생했어요')).toHaveCount(0);

    // The map either initializes (canvas/tiles) or degrades to MapFailover —
    // both acceptable; an uncaught exception is not.
    expect(errors).toEqual([]);
  });

  test('catalog places render and are searchable', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    const search = page.getByRole('searchbox');
    await expect(search).toBeVisible({ timeout: 10_000 });

    // List places are in the default (all-regions) card list
    const main = page.locator('main');
    await expect(main.getByText('대광어회집', { exact: false }).first()).toBeVisible();

    // Search narrows to the matching place
    await search.fill('대광어');
    await expect(main.getByText('대광어회집', { exact: false }).first()).toBeVisible();
    // Non-matching places from the same list disappear
    await expect(main.getByText('성수족발', { exact: false })).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test('region tabs derive from catalog (seoul present, busan absent)', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 10_000 });

    // Regression: region tabs must be catalog-derived, not a hardcoded region
    // set. With only a seoul list, 서울 appears and 부산 does not.
    const seoulTab = page.getByRole('tab', { name: '서울' });
    await expect(seoulTab).toBeVisible();
    await expect(page.getByRole('tab', { name: '부산' })).toHaveCount(0);

    await seoulTab.click();
    const main = page.locator('main');
    await expect(seoulTab).toHaveAttribute('aria-selected', 'true');
    await expect(main.getByText('대광어회집', { exact: false }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('selecting a place card opens the detail card', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    const search = page.getByRole('searchbox');
    await expect(search).toBeVisible({ timeout: 10_000 });

    await search.fill('대광어');
    const card = page
      .locator('main [role="button"]')
      .filter({ hasText: '대광어회집' })
      .first();
    await expect(card).toBeVisible();
    await card.click();

    // Detail card shows the place name as an h2 + close button
    await expect(
      page.locator('main h2').filter({ hasText: '대광어회집' })
    ).toBeVisible();
    const closeBtn = page.getByRole('button', { name: 'Close' });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(
      page.locator('main h2').filter({ hasText: '대광어회집' })
    ).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test('detail shows below the map with the curator-provided maps link; no on-map popup; SEO at bottom', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    const main = page.locator('main');
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 10_000 });

    // Before selection: a hint sits under the map
    await expect(main.getByText('장소를 선택하면', { exact: false })).toBeVisible();

    // Select a place → detail renders with the authored NAVER link (not a
    // name+address search fallback): every place carries a real naver.me link.
    await main.locator('#place-list [role="button"]').first().click();
    const openInMaps = main.getByRole('link', { name: '지도에서 보기' });
    await expect(openInMaps).toBeVisible();
    await expect(openInMaps).toHaveAttribute('href', /naver\.me\//);

    // The old on-map info popup ("Open in Maps →") is gone (it covered the map)
    await expect(page.getByText('Open in Maps →')).toHaveCount(0);

    // SEO long-form (HowTo/FAQ) moved to the bottom — assert it renders below the list
    const faqHeading = page.getByRole('heading', { name: '자주 묻는 질문' });
    await expect(faqHeading).toBeVisible();
    const listBox = await main.locator('#place-list').boundingBox();
    const faqBox = await faqHeading.boundingBox();
    expect(faqBox!.y).toBeGreaterThan(listBox!.y);

    expect(errors).toEqual([]);
  });

  test('every rendered category filter yields at least one place (no dead filters)', async ({
    page,
  }) => {
    // Regression: a hardcoded category list rendered '기타' with zero matching
    // places — clicking it showed a misleading empty state that read as an error.
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 10_000 });

    const main = page.locator('main');
    // Category pills live in the row right below the region tablist
    const categoryRow = main.locator('[role="tablist"] + div');
    const labels = await categoryRow.locator('button').allTextContents();
    expect(labels.length).toBeGreaterThan(1);

    for (const label of labels) {
      await categoryRow.getByRole('button', { name: label, exact: true }).click();
      await expect(
        main.locator('#place-list [role="button"]').first(),
        `category "${label}" must match at least one place`
      ).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('no-result search shows reset CTA and reset restores the list', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    const search = page.getByRole('searchbox');
    await expect(search).toBeVisible({ timeout: 10_000 });

    await search.fill('존재하지않는맛집zzz');
    const main = page.locator('main');
    await expect(main.getByText('조건에 맞는 맛집이 없어요', { exact: false })).toBeVisible();
    // The old favorites-onboarding message must not appear for filter no-results
    await expect(main.getByText('별을 눌러 즐겨찾기를 저장하세요')).toHaveCount(0);

    await main.getByRole('button', { name: '필터 초기화' }).click();
    await expect(main.locator('#place-list [role="button"]').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('curator legend, curator filter, and card avatars render (ko)', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    const main = page.locator('main');
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 10_000 });

    // Identity strip shows all three curators' avatars (SSR + hydrated)
    await expect(main.locator('img[src*="curators/nuclear.png"]').first()).toBeVisible();
    await expect(main.locator('img[src*="curators/dragon.png"]').first()).toBeVisible();
    await expect(main.locator('img[src*="curators/honey.png"]').first()).toBeVisible();

    // Curator filter renders the live curator (honey) as a pill button, and
    // hides curators with no places (dead-filter avoidance) — nuclear/dragon
    // appear in the legend text but NOT as filter buttons. Scope to the filter
    // group so place-card avatars (alt = curator name) don't match.
    const curatorFilter = page.locator('[aria-label="큐레이터로 필터"]');
    await expect(curatorFilter.getByRole('button', { name: '복현동 꿀주먹' })).toBeVisible();
    await expect(curatorFilter.getByRole('button', { name: '갈곶동 핵주먹' })).toHaveCount(0);
    await expect(curatorFilter.getByRole('button', { name: '철산동 용주먹' })).toHaveCount(0);

    // Clicking the live curator keeps the (all-honey) places visible
    await curatorFilter.getByRole('button', { name: '복현동 꿀주먹' }).click();
    const firstCard = main.locator('#place-list [role="button"]').first();
    await expect(firstCard).toBeVisible();
    // Cards carry the curator avatar next to the personal-take quote
    await expect(
      main.locator('#place-list img[src*="curators/honey.png"]').first()
    ).toBeVisible();

    await expect(page.getByText('문제가 발생했어요')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('my location: nearest-first sort, distance badges, and clear toggle (ko)', async ({
    page,
    context,
  }) => {
    const errors = collectPageErrors(page);
    await context.grantPermissions(['geolocation']);
    // User stands next to 성수족발 — last in catalog order, so a correct
    // nearest-first sort must move it to the top.
    await context.setGeolocation({ latitude: 37.5461, longitude: 127.0544 });

    await page.goto('/ko/tools/restaurant-map');
    const main = page.locator('main');
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 10_000 });

    // Catalog order before using location: 대광어회집 first
    await expect(main.locator('#place-list [role="button"]').first()).toContainText(
      '대광어회집'
    );

    await page.getByRole('button', { name: '내 위치' }).click();

    // Nearest-first re-sort + distance badges on cards
    await expect(main.locator('#place-list [role="button"]').first()).toContainText(
      '성수족발'
    );
    await expect(
      main.locator('#place-list').getByText(/^\d+(\.\d+)?km$/).first()
    ).toBeVisible();

    // The button becomes a pressed clear-toggle; clearing restores catalog order
    const clearBtn = page.getByRole('button', { name: '위치 해제' });
    await expect(clearBtn).toHaveAttribute('aria-pressed', 'true');
    await clearBtn.click();
    await expect(main.locator('#place-list [role="button"]').first()).toContainText(
      '대광어회집'
    );
    await expect(main.locator('#place-list').getByText(/^\d+(\.\d+)?km$/)).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test('my location denied shows an i18n alert without crashing (ko)', async ({
    page,
  }) => {
    // No grantPermissions → Playwright auto-denies the geolocation prompt.
    const errors = collectPageErrors(page);

    await page.goto('/ko/tools/restaurant-map');
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: '내 위치' }).click();

    await expect(
      page.getByRole('alert').filter({ hasText: '위치 권한이 거부되었습니다.' })
    ).toBeVisible();
    // Tool keeps working (no ErrorBoundary, list intact)
    await expect(page.getByText('문제가 발생했어요')).toHaveCount(0);
    await expect(
      page.locator('main #place-list [role="button"]').first()
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('en locale renders localized content without ErrorBoundary', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);

    await page.goto('/en/tools/restaurant-map');
    const search = page.getByRole('searchbox');
    await expect(search).toBeVisible({ timeout: 10_000 });

    await search.fill('Daegwangeo');
    await expect(
      page.locator('main').getByText('Daegwangeo Hoejip', { exact: false }).first()
    ).toBeVisible();

    await expect(page.getByText('문제가 발생했어요')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
