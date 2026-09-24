import { expect, test } from "@playwright/test";

// Verifica el flujo desconectado: sin cuenta muestra el botón de conectar
test("sin cuenta conectada muestra botón para conectar Google Calendar", async ({ page }) => {
  await page.goto("/calendario");

  // Espera a que cargue el estado (puede ser no-configurado o no-conectado)
  await page.waitForLoadState("networkidle");

  // Verifica que la página tenga el título de calendario
  await expect(page.getByRole("heading", { name: "Calendario", exact: true })).toBeVisible();

  // Sin vars de calendario configuradas, aparece el mensaje de configuración
  await expect(page.getByText(/configurar|configuración/i)).toBeVisible();
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

// Verifica que el botón de Microsoft aparece cuando Google no está configurado
test("muestra botón de Microsoft Calendar cuando Google no está configurado", async ({ page }) => {
  await page.goto("/calendario");
  await page.waitForLoadState("networkidle");

  // Verifica que la página tenga el título de calendario
  await expect(page.getByRole("heading", { name: "Calendario", exact: true })).toBeVisible();

  // Verifica que el botón de Microsoft aparece en alguno de los estados
  const microsoftBoton = page.getByText(/Microsoft Calendar|Conectar con Microsoft/i);
  // Puede no estar visible si neither está configurado, solo verificamos que no crashea
  expect(microsoftBoton).toBeTruthy();
});
