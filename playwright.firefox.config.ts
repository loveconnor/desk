import config from "./playwright.config";
export default {
  ...config,
  use: { ...config.use, browserName: "firefox" as const, launchOptions: {} },
  outputDir: "test-results/firefox",
};
