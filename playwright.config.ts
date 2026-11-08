import { defineConfig, devices } from "@playwright/test";

// e2e runs the app in mock mode (no keys, no network).
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://localhost:3100", trace: "off", launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ }],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_API_MODE: "mock", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
