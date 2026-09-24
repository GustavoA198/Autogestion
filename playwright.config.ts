import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${PUERTO}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Puerto distinto del de Docker para no chocar con la aplicación en ejecución
    command: `npm run dev -- --port ${PUERTO} --hostname 127.0.0.1`,
    url: `http://127.0.0.1:${PUERTO}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
