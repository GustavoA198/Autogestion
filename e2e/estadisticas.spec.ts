import { expect, test } from "@playwright/test";

test("carga y muestra selector y grafica de barras", async ({ page }) => {
  await page.goto("/estadisticas");
  await expect(page).toHaveURL(/\/estadisticas/);
  await expect(page.getByRole("heading", { level: 1, name: /estadisticas/i })).toBeVisible();
  await expect(page.getByLabel(/periodo/i)).toBeVisible();
});

test("selector cambia el periodo", async ({ page }) => {
  await page.goto("/estadisticas");
  await page.selectOption('select[name="semanas"]', "8");
  await expect(page).toHaveURL(/semanas=8/);
});
