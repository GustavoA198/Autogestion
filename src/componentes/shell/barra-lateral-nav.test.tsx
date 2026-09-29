// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GRUPOS_NAVEGACION } from "@/componentes/shell/barra-lateral";
import { BarraLateralNav } from "@/componentes/shell/barra-lateral-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/proyectos/abc/notas" }));

afterEach(cleanup);

describe("BarraLateralNav", () => {
  it("marca solo la sección activa con aria-current, también en rutas anidadas", () => {
    render(<BarraLateralNav grupos={GRUPOS_NAVEGACION} />);
    const activos = screen
      .getAllByRole("link")
      .filter((enlace) => enlace.getAttribute("aria-current") === "page");
    expect(activos.map((enlace) => enlace.textContent)).toEqual(["Proyectos"]);
  });

  it("expone las ocho secciones con su nombre accesible exacto", () => {
    render(<BarraLateralNav grupos={GRUPOS_NAVEGACION} variante="barra" />);
    const nombres = [
      "Panel",
      "Proyectos",
      "Tareas",
      "Calendario",
      "Notas / Bitácora",
      "Credenciales",
      "Contactos",
      "Estadísticas",
    ];
    for (const nombre of nombres) {
      expect(screen.getByRole("link", { name: nombre })).toBeTruthy();
    }
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeTruthy();
  });
});
