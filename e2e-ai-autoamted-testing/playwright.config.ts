import { defineConfig, devices } from '@playwright/test';


export default defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  reporter: [["list"], ["@midscene/web/playwright-report"]],
});
