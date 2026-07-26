import { test, expect, type Page } from '@playwright/test';

/**
 * Site-wide React hydration guard.
 *
 * A hydration mismatch (React #418/#423/#425) is invisible on screen — React
 * recovers by re-rendering on the client — but it is a real production defect
 * (wrong first paint, lost interactivity, SEO/CLS risk) and has recurred here
 * (my-ip `navigator.onLine`, lotto `matchMedia`-in-render). This promotes the
 * per-tool `pageerror` check to a shared-shell gate: it visits the home page
 * (both locales) and one tool per category, under `prefers-reduced-motion:
 * reduce` (the condition that surfaced the lotto mismatch), and asserts ZERO
 * React hydration-signature errors.
 *
 * Third-party noise (ad/analytics beacons, blocked requests) is excluded by the
 * narrow signature filter — only React hydration errors fail the test, so a
 * genuine regression is not masked.
 */

const ROUTES = [
  '/ko', // home — shared shell (Header/Footer/LocaleSwitcher/ThemeProvider)
  '/en', // home — locale-specific shell
  '/ko/tools/lotto-generator', // BallDisplay (reduced-motion)
  '/ko/tools/qna-a-day', // TodayPanel (date-in-render)
  '/ko/tools/ladder', // interactive SPA
  '/ko/tools/restaurant-map', // external SDK (NAVER Maps) injection
  '/ko/tools/new-word', // collection hub (SSR body + client grid)
];

const HYDRATION =
  /#4(18|23|25)|hydrat|did not match|Minified React error|Text content does/i;

async function collectHydrationErrors(page: Page, route: string): Promise<string[]> {
  const hits: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && HYDRATION.test(m.text())) hits.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => {
    if (HYDRATION.test(String(e.message))) hits.push(`pageerror: ${e.message}`);
  });
  // Reduced motion is the stricter hydration path: motion-gated inline styles are
  // a classic server≠client divergence (the lotto `matchMedia`-in-render bug).
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route, { waitUntil: 'networkidle' });
  // Allow hydration + any late third-party DOM injection to settle.
  await page.waitForTimeout(1000);
  return hits;
}

for (const route of ROUTES) {
  test(`no React hydration errors: ${route}`, async ({ page }) => {
    const hits = await collectHydrationErrors(page, route);
    expect(hits, `Hydration errors on ${route}:\n${hits.join('\n')}`).toEqual([]);
  });
}
