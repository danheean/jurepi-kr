const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const targets = [
    ['hub-ko-desktop', 'http://localhost:3100/ko/tools/dev-people', 1280],
    ['hub-ko-320', 'http://localhost:3100/ko/tools/dev-people', 320],
    ['hub-en-desktop', 'http://localhost:3100/en/tools/dev-people', 1280],
    ['spoke-karpathy-ko', 'http://localhost:3100/ko/tools/dev-people/andrej-karpathy', 1280],
    ['spoke-karpathy-en-320', 'http://localhost:3100/en/tools/dev-people/andrej-karpathy', 320],
    ['spoke-gamma-ko', 'http://localhost:3100/ko/tools/dev-people/erich-gamma', 1280],
  ];
  for (const [name, url, width] of targets) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: `_workspace/dev-people-screens/${name}.png`, fullPage: name.includes('spoke') });
    console.log(`${name}: console_errors=${errors.length} h_overflow=${overflow}${errors.length ? ' | ' + errors.slice(0,2).join(' ; ') : ''}`);
    await page.close();
  }
  await browser.close();
})();
