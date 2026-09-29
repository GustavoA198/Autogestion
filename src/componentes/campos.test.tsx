// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AreaTexto } from "@/componentes/area-texto";
import { Clipboard } from "@/componentes/clipboard";
import { Entrada } from "@/componentes/entrada";
import { EstadoError } from "@/componentes/estado-error";
import { EstadoVacio } from "@/componentes/estado-vacio";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Entrada", () => {
  it("el error se anuncia junto al campo y lo describe", () => {
    render(<Entrada etiqueta="Correo" invalido mensaje="Escribe un correo válido." />);
    const campo = screen.getByLabelText("Correo");
    const alerta = screen.getByRole("alert");
    expect(alerta.textContent).toContain("Escribe un correo válido.");
    expect(campo.getAttribute("aria-invalid")).toBe("true");
    expect(campo.getAttribute("aria-describedby")).toBe(alerta.id);
  });

  it("la ayuda describe el campo sin ser una alerta", () => {
    render(<Entrada etiqueta="Nombre" mensaje="Usa el nombre del cliente." />);
    expect(screen.queryByRole("alert")).toBeNull();
    const campo = screen.getByLabelText("Nombre");
    expect(campo.getAttribute("aria-describedby")).toBe(
      screen.getByText("Usa el nombre del cliente.").id,
    );
  });

  it("sin mensaje un campo inválido no crea alertas", () => {
    render(<Entrada etiqueta="Usuario" invalido />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByLabelText("Usuario").getAttribute("aria-invalid")).toBe("true");
  });

  it("la contraseña se puede mostrar y ocultar sin perder el valor", async () => {
    render(<Entrada etiqueta="Contraseña" type="password" defaultValue="secreto-123" />);
    const campo = screen.getByLabelText("Contraseña", { exact: true }) as HTMLInputElement;
    expect(campo.type).toBe("password");

    const mostrar = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(mostrar.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(mostrar);
    expect(campo.type).toBe("text");
    expect(campo.value).toBe("secreto-123");

    const ocultar = screen.getByRole("button", { name: "Ocultar contraseña" });
    expect(ocultar.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(ocultar);
    expect(campo.type).toBe("password");
  });

  it("el nombre del botón de mostrar ignora el texto opcional entre paréntesis", () => {
    render(<Entrada etiqueta="Nuevo secreto (opcional)" type="password" />);
    expect(screen.getByRole("button", { name: "Mostrar nuevo secreto" })).toBeTruthy();
  });

  it("el botón de mostrar no envía el formulario", async () => {
    const alEnviar = vi.fn((evento: { preventDefault: () => void }) => evento.preventDefault());
    render(
      <form onSubmit={alEnviar}>
        <Entrada etiqueta="Contraseña" type="password" />
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(alEnviar).not.toHaveBeenCalled();
  });
});

describe("AreaTexto", () => {
  it("asocia etiqueta y error al área de texto", () => {
    render(<AreaTexto etiqueta="Nota" invalido mensaje="Es demasiado larga." />);
    const area = screen.getByLabelText("Nota");
    expect(area.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });
});

describe("Clipboard", () => {
  it("copia el texto y confirma con un cambio visible", async () => {
    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: escribir },
      configurable: true,
    });
    render(<Clipboard texto="correo@ejemplo.com" />);

    await userEvent.click(screen.getByRole("button", { name: "Copiar al portapapeles" }));
    expect(escribir).toHaveBeenCalledWith("correo@ejemplo.com");
    expect(screen.getByText("Copiado")).toBeTruthy();
  });

  it("avisa cuando el navegador rechaza la copia", async () => {
    const escribir = vi.fn().mockRejectedValue(new Error("denegado"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: escribir },
      configurable: true,
    });
    render(<Clipboard texto="dato" />);

    await userEvent.click(screen.getByRole("button", { name: "Copiar al portapapeles" }));
    expect(screen.getByText("No se pudo copiar", { selector: "button" })).toBeTruthy();
  });
});

describe("Estados", () => {
  it("el estado vacío informa con título, descripción y acción", () => {
    render(
      <EstadoVacio
        titulo="Sin credenciales"
        descripcion="Crea la primera."
        accion={<button type="button">Nueva credencial</button>}
      />,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sin credenciales" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Nueva credencial" })).toBeTruthy();
  });

  it("el estado de error es una alerta con mensaje y acción de recuperación", () => {
    render(
      <EstadoError
        mensaje="No se pudo cargar."
        accion={<button type="button">Reintentar</button>}
      />,
    );
    const alerta = screen.getByRole("alert");
    expect(alerta.textContent).toContain("No se pudo cargar.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });
});
