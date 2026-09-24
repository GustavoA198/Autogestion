import { expect, test } from "@playwright/test";

test("la página de inicio muestra el título de la aplicación", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Autogestión" })).toBeVisible();
});

test("el endpoint de salud confirma la conexión a la base de datos", async ({ request }) => {
  const respuesta = await request.get("/api/health");
  expect(respuesta.ok()).toBe(true);
  expect(await respuesta.json()).toEqual({ estado: "ok", baseDatos: "conectada" });
});
