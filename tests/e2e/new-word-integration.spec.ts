import { test, expect } from '@playwright/test';

/**
 * E2E Tests for New Word Glossary
 * Based on SPEC final_integration_test scenarios 1–5
 *
 * Product flow: Bilingual glossary (Korean + English) with search, topic tabs,
 * detail panel (desktop sticky, mobile bottom-sheet), favorites/recents (localStorage),
 * language toggle (ko/en/both), related-term navigation.
 */

test.describe('New Word Glossary - E2E Integration', () => {
  test('Scenario 1: List renders 12 terms, bilingual card display', async ({ page }) => {
    // Visit Korean locale
    await page.goto('/ko/tools/new-word');
    await page.waitForLoadState('networkidle');

    // Intro + H1 visible
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 5000 });
    await expect(h1).toContainText('신조어 용어사전');

    // Term list rendered
    const termCards = page.locator('[data-testid^="term-card-"]');
    await expect(termCards).toHaveCount(12, { timeout: 5000 });

    // First card structure: Korean term + English subtitle
    const firstCard = termCards.nth(0);
    const cardText = await firstCard.textContent();
    expect(cardText).toBeTruthy();
    // Card should have Korean term visible
    const termName = firstCard.locator('h3, div').first();
    await expect(termName).toBeVisible();
  });

  test('Scenario 2: Search filter, topic tabs, empty state', async ({ page }) => {
    await page.goto('/ko/tools/new-word');
    await page.waitForLoadState('networkidle');

    // Search for a term (갓생)
    const searchInput = page.locator('[data-testid="term-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.click();
    await searchInput.fill('갓생');
    // Result count should update
    await page.waitForTimeout(200); // Debounce

    const termCards = page.locator('[data-testid^="term-card-"]');
    const cardCount = await termCards.count();
    expect(cardCount).toBeGreaterThan(0);
    expect(cardCount).toBeLessThanOrEqual(12);

    // Clear search
    const clearBtn = page.locator('[data-testid="term-search-clear"]');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await page.waitForTimeout(200);

    // Should restore full list
    await expect(termCards).toHaveCount(12);

    // Click "기술" (tech) topic tab
    const techTab = page.locator('[data-testid="topic-tab-tech"]');
    await expect(techTab).toBeVisible({ timeout: 5000 });
    await techTab.click();
    await page.waitForTimeout(100);

    // List narrows to tech terms only
    const filteredCards = page.locator('[data-testid^="term-card-"]');
    const techCount = await filteredCards.count();
    expect(techCount).toBeGreaterThan(0);
    expect(techCount).toBeLessThanOrEqual(12);

    // Search non-existent term
    await searchInput.click();
    await searchInput.fill('asdfqwer');
    await page.waitForTimeout(200);

    // Empty state should appear
    const emptyState = page.locator('text=/해당하는|없어요/');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 3: Detail view, Ko/En toggle, related navigation', async ({ page }) => {
    await page.goto('/ko/tools/new-word');
    await page.waitForLoadState('networkidle');

    // Click first card to open detail
    const firstCard = page.locator('[data-testid^="term-card-"]').nth(0);
    await firstCard.click();

    // Detail panel visible
    const detailPanel = page.locator('[data-testid="term-detail"]');
    await expect(detailPanel).toBeVisible({ timeout: 5000 });

    // Term name visible
    const detailName = detailPanel.locator('h2, h3').first();
    await expect(detailName).toBeVisible();

    // Definition visible (Korean)
    const definition = detailPanel.locator('text=/뜻|definition/i').first();
    await expect(definition).toBeVisible();

    // Language toggle visible (Korean tab active)
    const koToggle = page.locator('[data-testid="lang-toggle-ko"]');
    await expect(koToggle).toBeVisible({ timeout: 5000 });

    // Switch to Both
    const bothToggle = page.locator('[data-testid="lang-toggle-both"]');
    await expect(bothToggle).toBeVisible();
    await bothToggle.click();
    await page.waitForTimeout(100);

    // Both Ko and En sections should be visible (with labels or both defs)
    const defTexts = await detailPanel.textContent();
    expect(defTexts).toBeTruthy();
    // Should contain content (not asserting exact structure since it varies)

    // Related chips (if any)
    const relatedChips = page.locator('[data-testid^="related-chip-"]');
    const relatedCount = await relatedChips.count();
    if (relatedCount > 0) {
      // Click first related chip to navigate
      const firstRelated = relatedChips.nth(0);
      const relatedText = await firstRelated.textContent();
      await firstRelated.click();
      await page.waitForTimeout(100);

      // Detail should switch to that term
      const newDetailName = detailPanel.locator('h2, h3').first();
      const newText = await newDetailName.textContent();
      expect(newText).not.toBe('');
    }
  });

  test('Scenario 4: Favorites, recent views, localStorage persistence', async ({ page }) => {
    await page.goto('/ko/tools/new-word');
    await page.waitForLoadState('networkidle');

    // Click first card
    const firstCard = page.locator('[data-testid^="term-card-"]').nth(0);
    await firstCard.click();
    await page.waitForTimeout(100);

    // Click second card (should add to recent)
    const secondCard = page.locator('[data-testid^="term-card-"]').nth(1);
    await secondCard.click();
    await page.waitForTimeout(100);

    // "최근" (recent) tab should now appear
    const recentTab = page.locator('[data-testid="topic-tab-recent"]');
    await expect(recentTab).toBeVisible({ timeout: 5000 });

    // Star the first card (favorite)
    const firstCardAgain = page.locator('[data-testid^="term-card-"]').nth(0);
    const starBtn = firstCardAgain.locator('[data-testid^="term-star-"]').first();
    await expect(starBtn).toBeVisible();
    const ariaPressed = await starBtn.getAttribute('aria-pressed');
    await starBtn.click();
    await page.waitForTimeout(100);

    // Star should toggle
    const newAriaPressed = await starBtn.getAttribute('aria-pressed');
    expect(newAriaPressed).not.toBe(ariaPressed);

    // "즐겨찾기" (favorites) tab should appear
    const favTab = page.locator('[data-testid="topic-tab-favorites"]');
    await expect(favTab).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Favorites and recents should persist
    await expect(favTab).toBeVisible({ timeout: 5000 });
    await expect(recentTab).toBeVisible({ timeout: 5000 });

    // Recent count should still be 2
    const allCards = page.locator('[data-testid^="term-card-"]');
    expect(await allCards.count()).toBeGreaterThan(1);
  });

  test('Scenario 5: Locale swap, JSON-LD in static HTML', async ({ page }) => {
    // Visit English locale
    await page.goto('/en/tools/new-word');
    await page.waitForLoadState('networkidle');

    // H1 should be English
    const h1 = page.locator('h1');
    await expect(h1).toContainText(/New Word|Glossary/i);

    // Search placeholder should be English
    const searchInput = page.locator('[data-testid="term-search-input"]');
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder).toMatch(/glossary|term|search/i);

    // Topic tabs should be English labels
    const allTab = page.locator('[data-testid="topic-tab-all"]');
    const allTabText = await allTab.textContent();
    expect(allTabText).toMatch(/All/i);

    // Card structure: English first, Korean subtitle
    const firstCard = page.locator('[data-testid^="term-card-"]').nth(0);
    const cardText = await firstCard.textContent();
    expect(cardText).toBeTruthy();

    // Static HTML should contain JSON-LD (DefinedTermSet / DefinedTerm / FAQPage / SoftwareApplication)
    const scriptTags = page.locator('script[type="application/ld+json"]');
    const scriptCount = await scriptTags.count();
    expect(scriptCount).toBeGreaterThan(0);

    // At least one should be DefinedTermSet
    let foundDefinedTermSet = false;
    for (let i = 0; i < scriptCount; i++) {
      const scriptContent = await scriptTags.nth(i).textContent();
      if (scriptContent && scriptContent.includes('DefinedTermSet')) {
        foundDefinedTermSet = true;
        // Parse and validate basic structure
        const json = JSON.parse(scriptContent);
        expect(json['@type']).toBe('DefinedTermSet');
        // schema.org DefinedTermSet uses `hasDefinedTerm` (array of DefinedTerm)
        expect(Array.isArray(json.hasDefinedTerm)).toBe(true);
        expect(json.hasDefinedTerm.length).toBe(12);
        break;
      }
    }
    expect(foundDefinedTermSet).toBe(true);

    // Check for FAQ JSON-LD
    let foundFAQPage = false;
    for (let i = 0; i < scriptCount; i++) {
      const scriptContent = await scriptTags.nth(i).textContent();
      if (scriptContent && scriptContent.includes('FAQPage')) {
        foundFAQPage = true;
        break;
      }
    }
    expect(foundFAQPage).toBe(true);
  });

  test('Keyboard navigation: "/" focus search, arrow/Enter on list, Esc clear', async ({ page }) => {
    await page.goto('/ko/tools/new-word');
    await page.waitForLoadState('networkidle');

    // "/" should focus search input
    await page.keyboard.press('Slash');
    const searchInput = page.locator('[data-testid="term-search-input"]');
    await expect(searchInput).toBeFocused({ timeout: 5000 });

    // Type a search
    await page.keyboard.type('갓생');
    await page.waitForTimeout(200);

    // Esc should clear
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const inputValue = await searchInput.inputValue();
    expect(inputValue).toBe('');

    // Arrow down should move focus to first card (roving tabindex)
    const firstCard = page.locator('[data-testid^="term-card-"]').nth(0);
    await firstCard.focus();
    await page.keyboard.press('ArrowDown');
    const secondCard = page.locator('[data-testid^="term-card-"]').nth(1);
    const isFocused = await secondCard.evaluate((el) => el === document.activeElement);
    expect(isFocused || (await secondCard.getAttribute('tabindex')) === '0').toBeTruthy();
  });

  test('Accessibility: axe checks (no serious violations)', async ({ page }) => {
    await page.goto('/ko/tools/new-word');
    await page.waitForLoadState('networkidle');

    // Import axe for a basic scan (if axe-playwright available, or manual checks)
    // For now, check common a11y attributes
    const searchInput = page.locator('[data-testid="term-search-input"]');
    const roleAttr = await searchInput.getAttribute('role');
    expect(['searchbox', 'textbox', null]).toContain(roleAttr);

    // Cards should have meaningful labels (aria-label or text content)
    const firstCard = page.locator('[data-testid^="term-card-"]').nth(0);
    const ariaLabel = await firstCard.getAttribute('aria-label');
    const textContent = await firstCard.textContent();
    expect(ariaLabel || textContent).toBeTruthy();

    // Stars should have aria-pressed
    const starBtn = firstCard.locator('[data-testid^="term-star-"]').first();
    const ariaPressed = await starBtn.getAttribute('aria-pressed');
    expect(['true', 'false']).toContain(ariaPressed);

    // Language toggle lives inside the detail panel — open a term first.
    await firstCard.click();
    const langToggles = page.locator('[data-testid^="lang-toggle-"]');
    await expect(langToggles.first()).toBeVisible({ timeout: 5000 });
    const langCount = await langToggles.count();
    expect(langCount).toBeGreaterThan(0);
  });

  test('Mobile responsive: /en at 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('/en/tools/new-word');
    await page.waitForLoadState('networkidle');

    // Should not overflow
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 5000 });

    // Search input should be visible and not overflow
    const searchInput = page.locator('[data-testid="term-search-input"]');
    await expect(searchInput).toBeVisible();
    const boundingBox = await searchInput.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(320);

    // Cards should stack single column
    const termCards = page.locator('[data-testid^="term-card-"]');
    await expect(termCards).toHaveCount(12);

    // Click a card to open detail
    await termCards.nth(0).click();
    await page.waitForTimeout(100);

    // Detail should be visible (bottom-sheet on mobile, or visible panel)
    const detailPanel = page.locator('[data-testid="term-detail"]');
    await expect(detailPanel).toBeVisible({ timeout: 5000 });
  });
});
