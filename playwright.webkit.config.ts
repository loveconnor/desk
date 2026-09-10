import config from "./playwright.config";
export default {
  ...config,
  use: { ...config.use, browserName: "webkit" as const, launchOptions: {} },
  outputDir: "test-results/webkit",
};
