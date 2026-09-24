import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SECCIONES = [
  { ruta: "/dashboard", etiqueta: "Panel", titulo: "Panel general del día" },
  { ruta: "/proyectos", etiqueta: "Proyectos", titulo: "Proyectos" },
  { ruta: "/credenciales", etiqueta: "Credenciales", titulo: "Credenciales" },
  { ruta: "/contactos", etiqueta: "Contactos", titulo: "Contactos" },
  { ruta: "/calendario", etiqueta: "Calendario", titulo: "Calendario" },
  { ruta: "/tareas", etiqueta: "Tareas", titulo: "Tareas" },
  { ruta: "/notas", etiqueta: "Notas / Bitácora", titulo: "Notas y bitácora" },
];

// La sesión llega ya iniciada desde el proyecto de preparación (storageState)

test.describe("armazón visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("la barra lateral muestra las siete secciones principales", async ({ page }) => {
    const barra = page.getByRole("navigation", { name: "Navegación principal" });
    await expect(barra).toBeVisible();

    for (const seccion of SECCIONES) {
      await expect(barra.getByRole("link", { name: seccion.etiqueta, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("navigation")).toHaveCount(1);
  });

  test("la cabecera contiene el botón de cerrar sesión y no afirma estados inventados", async ({
    page,
  }) => {
    const cabecera = page.locator("header").first();
    await expect(cabecera.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
    await expect(page.getByText(/Localhost|Docker backup/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Notificaciones" })).toHaveCount(0);
  });

  for (const seccion of SECCIONES) {
    test(`la sección ${seccion.ruta} muestra su marcador y resalta el enlace activo`, async ({
      page,
    }) => {
      await page.goto(seccion.ruta);
      const titulo = page.getByRole("heading", { level: 1 });
      await expect(titulo).toHaveCount(1);
      await expect(titulo).toHaveText(seccion.titulo);
      const enlaceActivo = page
        .getByRole("navigation", { name: "Navegación principal" })
        .getByRole("link", { name: seccion.etiqueta, exact: true });
      await expect(enlaceActivo).toHaveAttribute("aria-current", "page");
    });
  }

  test("la raíz redirige al panel cuando hay sesión", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("accesibilidad del shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  for (const seccion of SECCIONES) {
    test(`axe: sin violaciones críticas o serias en ${seccion.ruta}`, async ({ page }) => {
      await page.goto(seccion.ruta);
      const resultados = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const graves = resultados.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(
        graves,
        `Violaciones críticas/serias en ${seccion.ruta}: ${JSON.stringify(graves, null, 2)}`,
      ).toEqual([]);
    });
  }
});

test.describe("navegación en móvil", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test.use({ viewport: { width: 390, height: 844 } });

  test("el menú hamburguesa abre y cierra la navegación", async ({ page }) => {
    const abrir = page.getByRole("button", { name: "Abrir navegación" });
    const navegacion = page.getByRole("navigation", { name: "Navegación principal" });

    await expect(navegacion).toBeHidden();
    await expect(abrir).toHaveAttribute("aria-expanded", "false");

    await abrir.click();
    await expect(navegacion).toBeVisible();
    await expect(abrir).toHaveAttribute("aria-expanded", "true");

    await page.getByRole("button", { name: "Cerrar navegación" }).click();
    await expect(navegacion).toBeHidden();
    await expect(abrir).toHaveAttribute("aria-expanded", "false");

    await abrir.click();
    await page.keyboard.press("Escape");
    await expect(navegacion).toBeHidden();
  });

  test("elegir una sección navega y cierra el menú", async ({ page }) => {
    await page.getByRole("button", { name: "Abrir navegación" }).click();
    await page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: "Proyectos", exact: true })
      .click();
    await expect(page).toHaveURL(/\/proyectos$/);
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeHidden();
  });
});

test.describe("navegación con teclado", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("el primer tabulador lleva al enlace para saltar al contenido", async ({ page }) => {
    await page.keyboard.press("Tab");
    const enlace = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(enlace).toBeFocused();
    await expect(enlace).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#contenido")).toBeFocused();
  });

  test("se llega con el teclado a un ítem del menú con foco visible", async ({ page }) => {
    const enlace = page
      .getByRole("navigation", { name: "Navegación principal" })
      .getByRole("link", { name: "Proyectos", exact: true });

    for (
      let i = 0;
      i < 10 && !(await enlace.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press("Tab");
    }
    await expect(enlace).toBeFocused();
    await expect(enlace).toHaveCSS("outline-style", "solid");
    await expect(enlace).toHaveCSS("outline-width", "2px");
  });
});

test.describe("sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("la página de inicio de sesión no muestra la barra lateral", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toHaveCount(0);
  });

  test("el borde de los campos cumple 3:1 contra el fondo (WCAG 1.4.11)", async ({ page }) => {
    await page.goto("/login");
    const contraste = await page.getByLabel("Usuario").evaluate((campo) => {
      const lienzo = document
        .createElement("canvas")
        .getContext("2d", { willReadFrequently: true })!;
      const rgba = (color: string): number[] => {
        lienzo.clearRect(0, 0, 1, 1);
        lienzo.fillStyle = "#000";
        lienzo.fillStyle = color;
        lienzo.fillRect(0, 0, 1, 1);
        return [...lienzo.getImageData(0, 0, 1, 1).data];
      };
      const luminancia = ([r, g, b]: number[]) => {
        const [rl, gl, bl] = [r, g, b].map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
      };
      const estilo = getComputedStyle(campo);
      const fondo = rgba(estilo.backgroundColor);
      const borde = rgba(estilo.borderTopColor);
      const alfa = borde[3] / 255;
      const mezcla = [0, 1, 2].map((i) => borde[i] * alfa + fondo[i] * (1 - alfa));
      const [a, b] = [luminancia(mezcla), luminancia(fondo)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    });
    expect(contraste).toBeGreaterThanOrEqual(3);
  });
});
