import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 5174;
const API_PORT = 4010;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // The mock API is a single shared server holding state, so tests run one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    locale: "en-US",
    timezoneId: "UTC",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      env: { MOCK_API_PORT: String(API_PORT) },
      url: `http://localhost:${API_PORT}/__test/requests`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // `testing` mode loads .env.testing, which points the app at the mock API.
      command: `npx vp dev --mode testing --port ${APP_PORT} --strictPort`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
