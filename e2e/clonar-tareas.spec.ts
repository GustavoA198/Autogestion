import { expect, test } from "@playwright/test";

test("clonar tareas recurrentes de un proyecto a otro", async ({ page }) => {
  const nombreA = `Proyecto Origen ${Date.now()}`;
  const nombreB = `Proyecto Destino ${Date.now()}`;
  const tarea1 = `Tarea Diaria ${Date.now()}`;
  const tarea2 = `Tarea Semanal ${Date.now()}`;

  // Crear proyecto A
  await page.goto("/proyectos/nuevo");
  await page.getByLabel("Nombre").fill(nombreA);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombreA })).toBeVisible();
  const urlA = page.url();

  // Crear proyecto B
  await page.goto("/proyectos/nuevo");
  await page.getByLabel("Nombre").fill(nombreB);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: nombreB })).toBeVisible();

  // Ir a proyecto A y crear dos tareas recurrentes
  await page.goto(urlA);
  await page.getByRole("link", { name: "Nueva" }).click();
  await page.getByLabel("Título").fill(tarea1);
  await page.getByLabel("Frecuencia").selectOption("DIARIA");
  await page.getByRole("button", { name: "Crear tarea" }).click();

  await page.goto(urlA);
  await page.getByRole("link", { name: "Nueva" }).click();
  await page.getByLabel("Título").fill(tarea2);
  await page.getByLabel("Frecuencia").selectOption("SEMANAL");
  await page.getByLabel("Día de la semana").selectOption("1");
  await page.getByRole("button", { name: "Crear tarea" }).click();

  // Abrir modal de clonar
  await page.goto(urlA);
  await page.getByRole("button", { name: "Clonar tareas" }).click();

  // Seleccionar ambas tareas
  const checkboxTarea1 = page.getByRole("checkbox", { name: tarea1 });
  const checkboxTarea2 = page.getByRole("checkbox", { name: tarea2 });
  await checkboxTarea1.check();
  await checkboxTarea2.check();

  // Elegir proyecto B como destino
  await page.getByLabel("Proyecto destino").selectOption({ label: nombreB });

  // Confirmar
  await expect(
    page.getByText(new RegExp(`Se clonarán 2 tareas al proyecto "${nombreB}"`)),
  ).toBeVisible();
  await page.getByRole("button", { name: /Clonar \(2\)/ }).click();

  // Verificar que estamos en proyecto B y tiene las tareas clonadas
  await expect(page).toHaveURL(new RegExp(`/proyectos/[^/]+$`));
  await expect(page.getByText(tarea1)).toBeVisible();
  await expect(page.getByText(tarea2)).toBeVisible();

  // Verificar que proyecto A sigue igual (2 tareas, no 4)
  await page.goto(urlA);
  await expect(page.getByText(tarea1)).toBeVisible();
  await expect(page.getByText(tarea2)).toBeVisible();

  // Limpiar
  await page.goto("/proyectos");
  await page
    .getByRole("link", { name: nombreA, exact: true })
    .locator("..")
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await page.getByRole("button", { name: "Eliminar proyecto" }).click();
  await page.goto("/proyectos");
  await page
    .getByRole("link", { name: nombreB, exact: true })
    .locator("..")
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await page.getByRole("button", { name: "Eliminar proyecto" }).click();
});
