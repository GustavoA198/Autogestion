import { expect, test } from "@playwright/test";

// La sesión llega ya iniciada desde el proyecto de preparación (storageState)
test("crear con secreto, revelarlo, editar sin cambiarlo, vincular a un proyecto y eliminar", async ({
  page,
}) => {
  const marca = Date.now();
  const nombre = `Credencial e2e ${marca}`;
  const proyecto = `Proyecto cred e2e ${marca}`;
  const secreto = `secreto-e2e-${marca}-Zx9`;

  await page.goto("/proyectos/nuevo");
  await page.getByLabel("Nombre").fill(proyecto);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: proyecto })).toBeVisible();
  const urlProyecto = page.url();

  await page.goto("/credenciales/nueva");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Categoría").selectOption("BASE_DATOS");
  await page.getByLabel("Usuario (opcional)").fill("admin-e2e");
  await page.getByLabel("Secreto", { exact: true }).fill(secreto);
  await page.getByLabel("Global (visible desde cualquier proyecto)").check();
  await page.getByRole("button", { name: "Crear credencial" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombre })).toBeVisible();
  const urlCredencial = page.url();

  // El secreto no viaja en el HTML del listado y aparece oculto
  await page.goto("/credenciales");
  const respuesta = await page.request.get("/credenciales");
  expect(await respuesta.text()).not.toContain(secreto);
  const fila = page.getByRole("row", { name: new RegExp(nombre) });
  await expect(fila.getByTestId("valor-secreto")).toHaveText(/^•+$/);

  await fila.getByRole("button", { name: `Revelar secreto de ${nombre}` }).click();
  await expect(fila.getByTestId("valor-secreto")).toHaveText(secreto);
  await fila.getByRole("button", { name: `Ocultar secreto de ${nombre}` }).click();
  await expect(fila.getByTestId("valor-secreto")).toHaveText(/^•+$/);

  // Editar sin escribir secreto conserva el actual y deja un solo cambio en el historial
  await page.goto(`${urlCredencial}/editar`);
  await page.getByLabel("Host o URL (opcional)").fill("db.example.com");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("cell", { name: "host o URL" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "secreto" })).toHaveCount(0);
  await page.getByRole("button", { name: `Revelar secreto de ${nombre}` }).click();
  await expect(page.getByTestId("valor-secreto")).toHaveText(secreto);

  // Pasa a ser exclusiva del proyecto vinculándola desde la ficha del proyecto
  await page.goto(`${urlCredencial}/editar`);
  await page.getByLabel("Global (visible desde cualquier proyecto)").uncheck();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("cell", { name: "alcance" })).toBeVisible();

  await page.goto(urlProyecto);
  await page.getByLabel("Vincular una credencial existente").selectOption({ label: nombre });
  await page.getByRole("button", { name: "Vincular", exact: true }).click();
  await expect(page.getByRole("link", { name: nombre })).toBeVisible();

  // El proyecto advierte que la credencial exclusiva se borrará junto con él
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("exclusivas que se borrarán (1)");
  await page.getByRole("button", { name: "Cancelar" }).click();

  await page.goto(urlCredencial);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Eliminar credencial" }).click();
  await expect(page).toHaveURL(/\/credenciales$/);
  await expect(page.getByRole("link", { name: nombre })).toHaveCount(0);

  // Limpieza del proyecto creado para la prueba
  await page.goto(urlProyecto);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Eliminar proyecto" }).click();
  await expect(page).toHaveURL(/\/proyectos$/);
});
