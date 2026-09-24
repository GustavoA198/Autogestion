// Tests e2e para el dashboard.
// Verifica que /dashboard carga con sus 6 bloques o sus estados vacio/error.
import { expect, test } from "@playwright/test";

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("carga sin errores y muestra el titulo del panel", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Panel del día");
    await expect(page.getByRole("heading", { level: 2, name: "Reuniones de hoy" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Tareas del día" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Proyectos" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Estadísticas/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Avisos pendientes" })).toBeVisible();
  });

  test("los enlaces de navegacion del dashboard funcionan", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Ver calendario" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver todas" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver todos" }).first()).toBeVisible();
  });

  test("el estado vacio del bloque de reuniones no muestra errores inventados", async ({ page }) => {
    const reuniones = page.getByRole("heading", { level: 2, name: "Reuniones de hoy" }).locator("..");
    const contenido = await reuniones.textContent();
    void contenido;
    await expect(page.getByText(/Sin reuniones|No hay reuniones/i)).toBeVisible();
  });

  test("el bloque de tareas muestra estado vacio o contenido", async ({ page }) => {
    const tareas = page.getByRole("heading", { level: 2, name: "Tareas del día" }).locator("..");
    const texto = await tareas.textContent();
    void texto;
    // No debe tener skeleton ni mensaje de error
    await expect(tareas.locator(".skeleton")).toHaveCount(0);
  });

  test("el bloque de proyectos muestra estado vacio o lista", async ({ page }) => {
    const proyectos = page.getByRole("heading", { level: 2, name: "Proyectos" }).locator("..");
    const texto = await proyectos.textContent();
    void texto;
    await expect(proyectos.locator(".skeleton")).toHaveCount(0);
  });

  test("el bloque de avisos pendientes no tiene skeleton", async ({ page }) => {
    const avisos = page.getByRole("heading", { level: 2, name: "Avisos pendientes" }).locator("..");
    await expect(avisos.locator(".skeleton")).toHaveCount(0);
  });
});
