import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'small-phone', use: { viewport: { width: 320, height: 568 }, browserName: 'chromium' } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 }, browserName: 'chromium' } },
    { name: 'laptop', use: { viewport: { width: 1024, height: 768 }, browserName: 'chromium' } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 }, browserName: 'chromium' } },
    ...(['firefox', 'webkit'] as const).flatMap(browserName => [
      { name: `${browserName}-phone`, use: { browserName, viewport: { width: 390, height: 844 } } },
      { name: `${browserName}-small-phone`, use: { browserName, viewport: { width: 320, height: 568 } } },
      { name: `${browserName}-tablet`, use: { browserName, viewport: { width: 768, height: 1024 } } },
      { name: `${browserName}-laptop`, use: { browserName, viewport: { width: 1024, height: 768 } } },
      { name: `${browserName}-desktop`, use: { browserName, viewport: { width: 1440, height: 900 } } },
    ]),
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI,
  },
})
