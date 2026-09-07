import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 1000 }, browserName: 'chromium', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run preview -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});
