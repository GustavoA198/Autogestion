import { expect, test as preparar } from "@playwright/test";
import { ARCHIVO_SESION, CLAVE_E2E, USUARIO_E2E, ipAleatoria } from "./soporte";

// Un único inicio de sesión por ejecución: el limitador global cuenta cada intento
preparar("inicia sesión una vez y guarda el estado", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ipAleatoria() });
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(USUARIO_E2E);
  await page.getByLabel("Contraseña").fill(CLAVE_E2E);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: ARCHIVO_SESION });
});
