import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets parallel worktree sessions run isolated servers (default 3000).
// With reuseExistingServer, a stale :3000 from ANOTHER worktree serves an out/
// without this worktree's tools → uniform 404 fake failures. Override per run:
//   E2E_PORT=3210 npx playwright test
const PORT = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // `output: 'export'` produces a static site in `out/`; `next start` is not
    // supported under export, so serve the build statically (same as the
    // Cloudflare Pages deploy). Allow extra time for the build + first `serve` fetch.
    command: `pnpm build && npx --yes serve@latest out -l ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
