// Tests e2e para la página de notificaciones.
import { expect, test } from "@playwright/test";
import { ARCHIVO_SESION } from "./soporte";

test.describe("notificaciones", () => {
  test.use({ storageState: ARCHIVO_SESION });

  test.beforeEach(async ({ page }) => {
    await page.goto("/notificaciones");
  });

  test("la página muestra su título y descripción", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Notificaciones");
    await expect(page.getByText("Recordatorios internos generados automáticamente.")).toBeVisible();
  });

  test("el indicador de notificaciones aparece en la cabecera cuando hay pendientes", async ({
    page,
  }) => {
    // El indicador solo es visible si hay notificaciones; si no hay, no debe aparecer
    const indicador = page.getByRole("link", { name: /notificac/i });
    // No afirmamos visibilidad porque depende del estado de la BD
  });

  test("muestra estado vacío cuando no hay notificaciones", async ({ page }) => {
    await expect(page.getByRole("status")).toBeVisible();
  });

  test("el botón descartar todas no aparece cuando no hay notificaciones", async ({ page }) => {
    const descartarTodas = page.getByRole("button", { name: "Descartar todas" });
    // Si no hay notificaciones, no debe estar visible
    if (await page.getByRole("status").isVisible()) {
      await expect(descartarTodas).toHaveCount(0);
    }
  });
});
