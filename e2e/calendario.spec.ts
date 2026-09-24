import { expect, test } from "@playwright/test";

// Verifica el flujo desconectado: sin cuenta muestra el botón de conectar
test("sin cuenta conectada muestra botón para conectar Google Calendar", async ({ page }) => {
  await page.goto("/calendario");

  // Espera a que cargue el estado (puede ser no-configurado o no-conectado)
  await page.waitForLoadState("networkidle");

  // Verifica que la página tenga el título de calendario
  await expect(page.getByRole("heading", { name: /calendario/i })).toBeVisible();

  // Sin variables de entorno configuradas, debe aparecer el mensaje de configuración pendiente
  // y el enlace a Google Cloud Console
  const configurado = await page
    .getByText(/pendiente de configurar|Google Cloud Console/i)
    .isVisible();
  const noConectado = await page.getByText(/no conectada|Connect with Google/i).isVisible();

  // Al menos uno de los dos estados debe aparecer (no-configurado o no-conectado)
  expect(configurado || noConectado).toBeTruthy();
});

// El e2e no intenta conectar a Google real, solo verifica que la UI responde correctamente
// al estado de cuenta no conectada
test("el botón de sincronizar no aparece cuando no hay cuenta conectada", async ({ page }) => {
  await page.goto("/calendario");
  await page.waitForLoadState("networkidle");

  // No debe haber botón de sincronizar cuando no está conectado
  const sincronizar = page.getByRole("button", { name: /sincronizar/i });
  await expect(sincronizar).not.toBeVisible();

  // No debe haber botón de nueva reunión
  const nuevaReunion = page.getByRole("button", { name: /nueva reunión/i });
  await expect(nuevaReunion).not.toBeVisible();
});
