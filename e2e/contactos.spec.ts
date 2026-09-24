import { expect, test } from "@playwright/test";

test("crear, buscar, editar, vincular a proyecto y eliminar", async ({ page }) => {
  const marca = Date.now();
  const nombre = `Contacto e2e ${marca}`;
  const correo = `contacto${marca}@ejemplo.com`;
  const empresa = `Empresa e2e ${marca}`;
  const proyecto = `Proyecto ctt e2e ${marca}`;

  // Crear proyecto
  await page.goto("/proyectos/nuevo");
  await page.getByLabel("Nombre").fill(proyecto);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: proyecto })).toBeVisible();
  const urlProyecto = page.url();

  // Crear contacto no global (para probar vinculacion)
  await page.goto("/contactos/nueva");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel("Empresa o cargo (opcional)").fill(empresa);
  await page.getByRole("button", { name: "Crear contacto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();
  const urlContacto = page.url();

  // Verificar en listado
  await page.goto("/contactos");
  const fila = page.getByRole("row", { name: new RegExp(nombre) });
  await expect(fila).toBeVisible();
  await expect(page.getByRole("cell", { name: new RegExp(correo) })).toBeVisible();

  // Copiar correo desde la ficha
  await page.goto(urlContacto);
  await expect(page.getByRole("link", { name: new RegExp(correo) })).toBeVisible();

  // Vincular desde el proyecto
  await page.goto(urlProyecto);
  await page.waitForSelector('[name="contactoId"]');
  await page.locator('[name="contactoId"]').selectOption({ label: nombre });
  await page.getByRole("button", { name: "Vincular" }).click();
  await expect(page.getByRole("link", { name: nombre })).toBeVisible();

  // Editar contacto
  await page.goto(`${urlContacto}/editar`);
  await page.getByLabel("Empresa o cargo (opcional)").fill(`${empresa} mod`);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();

  // Eliminar contacto
  await page.goto(urlContacto);
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("button", { name: "Eliminar contacto" }).click();
  await expect(page).toHaveURL(/\/contactos$/);
  await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);

  // Limpieza proyecto
  await page.goto(urlProyecto);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Eliminar proyecto" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
});
