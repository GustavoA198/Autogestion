import { defineConfig, devices } from "@playwright/test";
import { HASH_E2E, USUARIO_E2E } from "./e2e/soporte";

const PUERTO = 3100;
const URL_BASE = `http://127.0.0.1:${PUERTO}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: URL_BASE,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Puerto distinto del de Docker para no chocar con la aplicación en ejecución
    command: `npm run dev -- --port ${PUERTO} --hostname 127.0.0.1`,
    url: `${URL_BASE}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Acceso de pruebas independiente del que haya configurado el usuario en .env
    env: {
      AUTH_USUARIO: USUARIO_E2E,
      AUTH_CLAVE_HASH: HASH_E2E,
      NEXTAUTH_SECRET: "secreto-solo-para-pruebas-e2e-".repeat(2),
      NEXTAUTH_URL: URL_BASE,
    },
  },
});
