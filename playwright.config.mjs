// Playwright config — E2E smoke tests for Taomony v2.
// See e2e/meditation-smoke.spec.js for the meditation happy-path smoke test.
//
// Browsers are kept OFF the C: drive (project rule: downloads live on D:).
// This is set here for test runs; the one-time browser download ALSO needs it
// as a shell env var:
//   PLAYWRIGHT_BROWSERS_PATH='D:/Developer/ms-playwright' npx playwright install chromium
//
// NOTE: the default chromium download (storage.googleapis.com) hangs in this
// environment, so installs should use the npmmirror mirror:
//   PLAYWRIGHT_DOWNLOAD_HOST='https://npmmirror.com/mirrors/playwright'

import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH || 'D:/Developer/ms-playwright';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 390, height: 844 }, // mobile-first
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
