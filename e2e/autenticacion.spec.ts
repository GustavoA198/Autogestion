import { expect, test, type Page } from "@playwright/test";
import { CLAVE_E2E, USUARIO_E2E, ipAleatoria } from "./soporte";

async function iniciarSesion(page: Page, usuario: string, clave: string) {
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(clave);
  await page.getByRole("button", { name: "Entrar" }).click();
}

// Cada prueba usa su propia IP simulada para no compartir contador del limitador
test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ipAleatoria() });
});

test.describe("rutas protegidas", () => {
  test("redirige al inicio de sesión conservando la ruta pedida", async ({ page }) => {
    await page.goto("/?origen=prueba");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2F%3Forigen%3Dprueba$/);
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("responde 401 en la API sin sesión", async ({ request }) => {
    const respuesta = await request.get("/api/cualquier-recurso");
    expect(respuesta.status()).toBe(401);
    expect(await respuesta.json()).toEqual({ error: "No autenticado" });
  });
});

test.describe("inicio y cierre de sesión", () => {
  test("rechaza credenciales incorrectas con un mensaje que no revela cuál falló", async ({
    page,
  }) => {
    await page.goto("/login");
    await iniciarSesion(page, USUARIO_E2E, "clave-incorrecta-123");
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Usuario o contraseña incorrectos.",
    );

    await iniciarSesion(page, "usuario-inexistente", CLAVE_E2E);
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Usuario o contraseña incorrectos.",
    );
    await expect(page).toHaveURL(/\/login/);
  });

  test("entra, protege la cookie, mantiene la sesión y la cierra", async ({ page, context }) => {
    await page.goto("/login");
    await iniciarSesion(page, USUARIO_E2E, CLAVE_E2E);
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();

    const cookie = (await context.cookies()).find((c) =>
      c.name.endsWith("next-auth.session-token"),
    );
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    expect(await page.evaluate(() => document.cookie)).not.toContain("session-token");

    await page.reload();
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("ignora un destino externo y entra al panel", async ({ page }) => {
    await page.goto("/login?callbackUrl=https%3A%2F%2Fsitio-malicioso.com");
    await iniciarSesion(page, USUARIO_E2E, CLAVE_E2E);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("limitación de intentos", () => {
  test("bloquea tras superar el máximo de intentos, incluso con la clave correcta", async ({
    page,
  }) => {
    await page.goto("/login");

    for (let intento = 1; intento <= 5; intento++) {
      await iniciarSesion(page, USUARIO_E2E, `clave-incorrecta-${intento}`);
      await expect(page.locator("form").getByRole("alert")).toHaveText(
        "Usuario o contraseña incorrectos.",
      );
    }

    await iniciarSesion(page, USUARIO_E2E, CLAVE_E2E);
    await expect(page.locator("form").getByRole("alert")).toContainText("Demasiados intentos");
    await expect(page).toHaveURL(/\/login/);
  });
});
