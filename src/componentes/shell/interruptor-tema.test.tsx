// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InterruptorTema } from "@/componentes/shell/interruptor-tema";
import { CLAVE_TEMA } from "@/lib/tema";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function abrirMenu() {
  await userEvent.click(screen.getByRole("button", { name: /Cambiar tema/ }));
}

describe("InterruptorTema", () => {
  it("ofrece claro, oscuro y sistema como opciones de un menú", async () => {
    render(<InterruptorTema />);
    await abrirMenu();
    const opciones = screen.getAllByRole("menuitemradio");
    expect(opciones.map((opcion) => opcion.textContent)).toEqual(["Claro", "Oscuro", "Sistema"]);
    expect(
      screen.getByRole("menuitemradio", { name: "Sistema" }).getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("aplica el tema oscuro, lo persiste y devuelve el foco al botón", async () => {
    render(<InterruptorTema />);
    await abrirMenu();
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Oscuro" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("autogestion-oscuro");
    expect(localStorage.getItem(CLAVE_TEMA)).toBe("oscuro");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Tema: Oscuro/ }));
  });

  it("volver a Sistema quita el atributo y la preferencia guardada", async () => {
    localStorage.setItem(CLAVE_TEMA, "claro");
    document.documentElement.setAttribute("data-theme", "autogestion-claro");
    render(<InterruptorTema />);
    await abrirMenu();
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Sistema" }));

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem(CLAVE_TEMA)).toBeNull();
  });

  it("Escape cierra el menú y las flechas mueven el foco entre opciones", async () => {
    render(<InterruptorTema />);
    await abrirMenu();
    expect(document.activeElement).toBe(screen.getByRole("menuitemradio", { name: "Sistema" }));

    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("menuitemradio", { name: "Oscuro" }));

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Cambiar tema/ }));
  });

  it("sigue funcionando aunque localStorage lance errores", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    render(<InterruptorTema />);
    await abrirMenu();
    await act(async () => {
      await userEvent.click(screen.getByRole("menuitemradio", { name: "Oscuro" }));
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("autogestion-oscuro");
  });
});
