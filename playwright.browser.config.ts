import { defineConfig } from '@playwright/test';
import config from './playwright.config';
export default defineConfig({
  ...config,
  testMatch: 'browser.spec.ts',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox', launchOptions: {} } },
    { name: 'webkit', use: { browserName: 'webkit', launchOptions: {} } },
  ],
});
