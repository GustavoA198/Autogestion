import { expect, test } from "@playwright/test";
import { ARCHIVO_SESION } from "./soporte";

test.use({ storageState: ARCHIVO_SESION });

test.describe("buscador global", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("Ctrl+K enfoca el campo de búsqueda en la cabecera", async ({ page }) => {
    await page.keyboard.press("Control+k");
    await expect(page.locator('input[name="q"]')).toBeFocused();
  });

  test("la página /buscar sin parámetro q muestra estado vacío", async ({ page }) => {
    await page.goto("/buscar");
    await expect(page.getByRole("heading", { name: "Buscar" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Escribe" })).toBeVisible();
  });

  test("la búsqueda con término corto muestra error de validación", async ({ page }) => {
    await page.goto("/buscar?q=a");
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("la búsqueda por URL sin resultados muestra estado vacío", async ({ page }) => {
    await page.goto("/buscar?q=termino-que-no-existe-en-la-base");
    await expect(page.getByRole("heading", { name: "Sin resultados" })).toBeVisible();
  });
});
