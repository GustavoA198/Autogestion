import { expect, test } from "@playwright/test";

test("crear 2 entradas en dias distintos, ver agrupadas, buscar, editar y eliminar", async ({
  page,
}) => {
  const marca = Date.now();
  const proyecto = `Proyecto notas e2e ${marca}`;
  const texto1 = `Entrada dia uno ${marca}`;
  const texto2 = `Entrada dia dos ${marca}`;

  // Crear proyecto
  await page.goto("/proyectos/nuevo");
  await page.getByLabel("Nombre").fill(proyecto);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: proyecto })).toBeVisible();
  const urlProyecto = page.url();

  // Crear primera entrada (hoy)
  await page.goto(`${urlProyecto}/notas/nueva`);
  await page.getByLabel("Fecha").fill(new Date().toISOString().split("T")[0]);
  await page.getByLabel("Texto").fill(texto1);
  await page.getByRole("button", { name: "Crear entrada" }).click();
  await expect(page).toHaveURL(/\/notas$/);

  // Crear segunda entrada (ayer)
  await page.goto(`${urlProyecto}/notas/nueva`);
  const ayer = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  await page.getByLabel("Fecha").fill(ayer);
  await page.getByLabel("Texto").fill(texto2);
  await page.getByRole("button", { name: "Crear entrada" }).click();
  await expect(page).toHaveURL(/\/notas$/);

  // Ver que ambas notas aparecen en la lista de la bitácora
  await expect(page.getByText(texto1)).toBeVisible();
  await expect(page.getByText(texto2)).toBeVisible();

  // Buscar por texto de la primera entrada
  await page.getByPlaceholder("Buscar en notas...").fill(texto1);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText(texto1)).toBeVisible();
  await expect(page.getByText(texto2)).not.toBeVisible();

  // Limpiar búsqueda
  await page.getByRole("link", { name: "Limpiar" }).click();
  await expect(page.getByText(texto1)).toBeVisible();
  await expect(page.getByText(texto2)).toBeVisible();

  // Ir a la primera nota y editarla
  await page.getByRole("link", { name: new RegExp(texto1.slice(0, 30)) }).click();
  const urlNota = page.url();
  await page.getByRole("button", { name: "Editar" }).click();
  const textoEditado = `${texto1} modificada`;
  await page.getByLabel("Texto").fill(textoEditado);
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(/\/notas\//);
  await expect(page.getByText(textoEditado)).toBeVisible();

  // Volver a la lista y verificar que la editada aparece
  await page.goto(`${urlProyecto}/notas`);
  await expect(page.getByText(textoEditado)).toBeVisible();

  // Eliminar la nota editada desde la ficha
  await page.goto(urlNota);
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("button", { name: "Eliminar entrada" }).click();
  await expect(page).toHaveURL(new RegExp(`/proyectos/[^/]+/notas`));

  // La nota eliminada ya no aparece
  await page.goto(`${urlProyecto}/notas`);
  await expect(page.getByText(textoEditado)).not.toBeVisible();
  await expect(page.getByText(texto2)).toBeVisible();

  // Limpieza: eliminar proyecto
  await page.goto(urlProyecto);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Eliminar proyecto" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
});
