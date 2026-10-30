import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run build && npm run preview -- --ignore-lock",
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: { baseURL: "http://localhost:4321" },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
});
