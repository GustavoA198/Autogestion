import { defineConfig, devices } from "@playwright/test";
import { ARCHIVO_SESION, HASH_E2E, USUARIO_E2E } from "./e2e/soporte";

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
  projects: [
    { name: "preparacion", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: /(shell|proyectos|credenciales|notas)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Reutiliza la sesiÃ³n guardada para no gastar intentos del limitador en cada prueba
      name: "chromium-con-sesion",
      testMatch: /(shell|proyectos|credenciales|contactos|notas)\.spec\.ts/,
      dependencies: ["preparacion"],
      use: { ...devices["Desktop Chrome"], storageState: ARCHIVO_SESION },
    },
  ],
  webServer: {
    // Puerto distinto del de Docker para no chocar con la aplicaciÃ³n en ejecuciÃ³n
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
