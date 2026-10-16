import { expect, test } from "@playwright/test";

// La sesión llega ya iniciada desde el proyecto de preparación (storageState)
test("crear, listar, editar, abrir la ficha y eliminar un proyecto", async ({ page }) => {
  const nombre = `Proyecto e2e ${Date.now()}`;
  const nombreEditado = `${nombre} editado`;
  const campoNombre = page.getByLabel("Nombre", { exact: true }).first();
  const campoNombreEnlace = page.getByLabel("Nombre", { exact: true }).nth(1);
  const campoEnlace = page.getByLabel("Enlace", { exact: true });

  await page.goto("/proyectos/nuevo");
  await campoNombre.fill(nombre);
  await page.getByRole("button", { name: "Agregar enlace" }).click();
  await campoNombreEnlace.fill("Docs e2e");
  await campoEnlace.fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByText(/URL válida/)).toBeVisible();

  await campoEnlace.fill("https://example.com/docs");
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();

  const enlace = page.getByRole("link", { name: /Docs e2e/ });
  await expect(enlace).toHaveAttribute("target", "_blank");
  await expect(enlace).toHaveAttribute("rel", /noopener/);
  for (const seccion of ["Credenciales", "Contactos", "Tareas y reuniones", "Notas"]) {
    await expect(page.getByRole("heading", { name: seccion })).toBeVisible();
  }

  await page.goto("/proyectos");
  await page.getByRole("link", { name: nombre, exact: true }).click();
  await page.getByRole("link", { name: "Editar" }).click();
  await campoNombre.fill(nombreEditado);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombreEditado })).toBeVisible();

  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Eliminar proyecto" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
  await expect(page.getByRole("link", { name: nombreEditado })).toHaveCount(0);
});
