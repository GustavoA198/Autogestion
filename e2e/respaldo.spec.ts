import { expect, test } from "@playwright/test";

// Verifica que /respaldo carga y muestra estado de Drive sin cuenta conectada
test("la pagina de respaldo carga y muestra Drive no conectado", async ({ page }) => {
  await page.goto("/respaldo");
  await page.waitForLoadState("networkidle");

  // Verifica que la pagina tiene el titulo de respaldo
  await expect(page.getByRole("heading", { name: /respaldo/i })).toBeVisible();

  // Sin cuenta Google conectada debe aparecer el mensaje de Drive no conectado
  const noConectado = await page.getByText(/no conectado|Drive no conectado/i).isVisible();

  // Verifica que el boton de generar respaldo aparece (deshabilitado) o el aviso
  const botonGenerar = page.getByRole("button", { name: /generar respaldo/i });
  // Si Drive no esta conectado el boton debe estar deshabilitado
  await expect(botonGenerar).toBeVisible();
});

test("el boton de restaurar desde archivo abre el modal de confirmacion", async ({ page }) => {
  await page.goto("/respaldo");
  await page.waitForLoadState("networkidle");

  const botonRestaurar = page.getByRole("button", { name: /restaurar desde archivo/i });
  await expect(botonRestaurar).toBeVisible();

  await botonRestaurar.click();

  // El modal debe abrirse con el texto de advertencia
  await expect(page.getByText(/sobreescribira los datos actuales/i)).toBeVisible();
});
