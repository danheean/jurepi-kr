import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Vitest runs unit/component tests under src/ only.
    // Playwright E2E/a11y specs (tests/**) run via `pnpm exec playwright test`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'tests/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      // Scope coverage to application logic. Build artifacts, config, and
      // framework entrypoints (App Router pages/layouts, sitemap/robots/manifest,
      // middleware, next-intl wiring) are verified by `next build` + E2E, not unit tests.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '.next/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        'vitest.setup.ts',
        'src/__test__/**',
        'src/app/**',
        'src/middleware.ts',
        'src/i18n/routing.ts',
        'src/i18n/request.ts',
        'src/tools/types.ts',
        // Type-only modules and barrels have no executable code — v8 reports them
        // as 0%, which understates real coverage. (`.d.ts` already excluded above.)
        'src/**/types.ts',
        'src/**/index.ts',
        // JSON-LD emitters: their output (schema.org url==canonical, exactly one
        // FAQPage/SoftwareApplication) is verified in the prerendered HTML by the
        // integration-qa prerender gate + E2E, not by unit tests.
        'src/**/*StructuredData.tsx',
        // Third-party script wrappers (adsbygoogle.js / GTM inline tags): no unit
        // logic; verified live by E2E + browser network checks.
        'src/components/analytics/**',
      ],
      // Ratchet: a hard floor so coverage can't silently drift back to the old
      // ~72% plateau. Set below the current measured level to tolerate small
      // fluctuation while blocking regression. `pnpm test:coverage` fails if any
      // metric drops under its floor. New domain logic should still land ≥90%
      // locally (see integration-qa); this only guards the whole-repo baseline.
      // Floors ~2 pts below the measured level (statements 80.97 / branches 86.56
      // / functions 84.79 / lines 80.97) — locks in the current baseline and fails
      // loudly long before any drift toward the old ~72% plateau, while tolerating
      // normal per-PR churn so the gate stays trustworthy (never false-trips).
      thresholds: {
        statements: 79,
        branches: 84,
        functions: 82,
        lines: 79,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
