// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProveedorAvisos, useAvisos } from "@/componentes/aviso";
import { Boton } from "@/componentes/boton";
import { Casilla } from "@/componentes/casilla";
import { Confirmacion } from "@/componentes/confirmacion";
import { Entrada } from "@/componentes/entrada";
import { Modal } from "@/componentes/modal";
import { Pestania } from "@/componentes/pestania";
import { Selector } from "@/componentes/selector";
import { Tabla } from "@/componentes/tabla";

// jsdom no implementa showModal ni close: se simulan con el mismo evento close asíncrono del navegador
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    setTimeout(() => this.dispatchEvent(new Event("close")), 0);
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const esperarEventosNativos = () => act(() => new Promise((resolver) => setTimeout(resolver, 5)));

describe("Boton", () => {
  it("usa type button y la variante primaria por defecto", () => {
    render(<Boton>Guardar</Boton>);
    const boton = screen.getByRole("button", { name: "Guardar" });
    expect(boton).toHaveProperty("type", "button");
    expect(boton.className).toContain("btn-primary");
  });

  it("se deshabilita y marca aria-busy mientras carga", () => {
    render(<Boton cargando>Guardar</Boton>);
    const boton = screen.getByRole("button", { name: "Guardar" });
    expect(boton).toHaveProperty("disabled", true);
    expect(boton.getAttribute("aria-busy")).toBe("true");
  });

  it("aplica la variante y el tamano pedidos", () => {
    render(
      <Boton variante="peligro" tamano="pequeno">
        Borrar
      </Boton>,
    );
    const boton = screen.getByRole("button", { name: "Borrar" });
    expect(boton.className).toContain("btn-error");
    expect(boton.className).toContain("btn-sm");
  });
});

function ModalControlado({ alCerrar }: { alCerrar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button onClick={() => setAbierto(true)}>Abrir</button>
      <button onClick={() => setAbierto(false)}>Cerrar desde el padre</button>
      <Modal
        abierto={abierto}
        alCerrar={() => {
          alCerrar();
          setAbierto(false);
        }}
        titulo="Nuevo proyecto"
        descripcion="Completa los datos"
      >
        Contenido
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("se abre y se cierra según la propiedad abierto sin llamar a alCerrar", async () => {
    const alCerrar = vi.fn();
    render(<ModalControlado alCerrar={alCerrar} />);
    const dialogo = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialogo.open).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(dialogo.open).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Cerrar desde el padre" }));
    await esperarEventosNativos();
    expect(dialogo.open).toBe(false);
    expect(alCerrar).not.toHaveBeenCalled();
  });

  it("enlaza título y descripción con el diálogo mediante ids generados", async () => {
    render(<ModalControlado alCerrar={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    const dialogo = screen.getByRole("dialog");
    const titulo = screen.getByRole("heading", { name: "Nuevo proyecto" });
    expect(dialogo.getAttribute("aria-labelledby")).toBe(titulo.id);
    expect(dialogo.getAttribute("aria-describedby")).toBe(
      screen.getByText("Completa los datos").id,
    );
    expect(titulo.id).not.toContain("nuevo-proyecto");
  });

  it("Escape (evento cancel) pide cerrar una sola vez y no cierra por su cuenta", async () => {
    const alCerrar = vi.fn();
    render(<Modal abierto alCerrar={alCerrar} titulo="Aviso" />);
    const dialogo = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialogo.open).toBe(true);

    const cancelar = new Event("cancel", { cancelable: true });
    dialogo.dispatchEvent(cancelar);
    await esperarEventosNativos();

    expect(cancelar.defaultPrevented).toBe(true);
    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(dialogo.open).toBe(true);
  });

  it("el botón Cerrar y el clic en el fondo llaman a alCerrar una vez cada uno", async () => {
    const alCerrar = vi.fn();
    render(<Modal abierto alCerrar={alCerrar} titulo="Aviso" />);
    const dialogo = document.querySelector("dialog") as HTMLDialogElement;

    await userEvent.click(screen.getByRole("button", { name: "Cerrar", hidden: true }));
    expect(alCerrar).toHaveBeenCalledTimes(1);

    fireEvent.click(dialogo);
    expect(alCerrar).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText("Aviso"));
    expect(alCerrar).toHaveBeenCalledTimes(2);
  });

  it("un cierre nativo inesperado se comunica al padre una sola vez", async () => {
    const alCerrar = vi.fn();
    render(<Modal abierto alCerrar={alCerrar} titulo="Aviso" />);
    const dialogo = document.querySelector("dialog") as HTMLDialogElement;

    dialogo.close();
    await esperarEventosNativos();
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it("solo hay un botón de cierre visible para el usuario", () => {
    render(<Modal abierto alCerrar={() => {}} titulo="Aviso" />);
    expect(screen.getAllByRole("button", { hidden: true })).toHaveLength(1);
  });
});

describe("Confirmacion", () => {
  function preparar(destructivo = false) {
    const alCancelar = vi.fn();
    const alConfirmar = vi.fn();
    render(
      <Confirmacion
        abierto
        alCancelar={alCancelar}
        alConfirmar={alConfirmar}
        titulo="Eliminar proyecto"
        mensaje="Esta acción no se puede deshacer"
        textoConfirmar="Eliminar"
        destructivo={destructivo}
      />,
    );
    return { alCancelar, alConfirmar };
  }

  it("confirma con el botón de confirmación", async () => {
    const { alCancelar, alConfirmar } = preparar();
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(alConfirmar).toHaveBeenCalledTimes(1);
    expect(alCancelar).not.toHaveBeenCalled();
  });

  it("cancela con el botón Cancelar", async () => {
    const { alCancelar, alConfirmar } = preparar();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(alCancelar).toHaveBeenCalledTimes(1);
    expect(alConfirmar).not.toHaveBeenCalled();
  });

  it("el mensaje aparece una sola vez y describe el diálogo", () => {
    preparar();
    expect(screen.getAllByText("Esta acción no se puede deshacer")).toHaveLength(1);
    const dialogo = screen.getByRole("dialog");
    expect(dialogo.getAttribute("aria-describedby")).toBe(
      screen.getByText("Esta acción no se puede deshacer").id,
    );
  });

  it("si es destructiva usa alertdialog, botón de peligro y foco inicial en Cancelar", () => {
    preparar(true);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eliminar" }).className).toContain("btn-error");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancelar" }));
  });

  it("si no es destructiva usa dialog", () => {
    preparar(false);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

describe("Selector", () => {
  it("asocia la etiqueta y permite elegir una opción", async () => {
    const alCambiar = vi.fn();
    render(
      <Selector etiqueta="Frecuencia" onChange={alCambiar} defaultValue="diaria">
        <option value="diaria">Diaria</option>
        <option value="semanal">Semanal</option>
      </Selector>,
    );
    const selector = screen.getByLabelText("Frecuencia") as HTMLSelectElement;
    await userEvent.selectOptions(selector, "semanal");
    expect(selector.value).toBe("semanal");
    expect(alCambiar).toHaveBeenCalledTimes(1);
  });

  it("enlaza el mensaje de error y marca el campo como inválido", () => {
    render(
      <Selector etiqueta="Frecuencia" mensaje="Elige una opción" invalido>
        <option value="">-</option>
      </Selector>,
    );
    const selector = screen.getByLabelText("Frecuencia");
    expect(selector.getAttribute("aria-invalid")).toBe("true");
    expect(selector.getAttribute("aria-describedby")).toBe(screen.getByText("Elige una opción").id);
  });

  it("dos campos con la misma etiqueta no comparten id", () => {
    render(
      <>
        <Entrada etiqueta="Nombre" />
        <Entrada etiqueta="Nombre" />
        <Casilla etiqueta="Nombre" />
      </>,
    );
    const ids = screen.getAllByLabelText("Nombre").map((elemento) => elemento.id);
    expect(new Set(ids).size).toBe(3);
  });
});

function Disparador({ mensaje, tono }: { mensaje: string; tono?: "critico" | "exito" }) {
  const { notificar } = useAvisos();
  return <button onClick={() => notificar(mensaje, tono)}>Notificar {mensaje}</button>;
}

describe("Aviso", () => {
  it("muestra el aviso en la región status y lo cierra con su botón", async () => {
    render(
      <ProveedorAvisos>
        <Disparador mensaje="Guardado" tono="exito" />
      </ProveedorAvisos>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Notificar Guardado" }));
    expect(screen.getByRole("status").textContent).toContain("Guardado");
    expect(screen.getByRole("alert").textContent).not.toContain("Guardado");

    await userEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText("Guardado")).toBeNull();
  });

  it("el tono crítico va en la región alert", async () => {
    render(
      <ProveedorAvisos>
        <Disparador mensaje="Falló el respaldo" tono="critico" />
      </ProveedorAvisos>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Notificar Falló el respaldo" }));
    expect(screen.getByRole("alert").textContent).toContain("Falló el respaldo");
    expect(screen.getByRole("status").textContent).not.toContain("Falló el respaldo");
  });

  it("las regiones en vivo existen antes de que llegue algún aviso", () => {
    render(
      <ProveedorAvisos>
        <p>Contenido</p>
      </ProveedorAvisos>,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Avisos de la aplicación" })).toBeTruthy();
  });

  it("desaparece solo a los 5 segundos", () => {
    vi.useFakeTimers();
    render(
      <ProveedorAvisos>
        <Disparador mensaje="Temporal" />
      </ProveedorAvisos>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notificar Temporal" }));
    expect(screen.queryAllByText("Temporal")).toHaveLength(1);

    act(() => vi.advanceTimersByTime(4900));
    expect(screen.queryAllByText("Temporal")).toHaveLength(1);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryAllByText("Temporal")).toHaveLength(0);
  });

  it("se pausa con el puntero encima y sigue al salir (WCAG 2.2.1)", () => {
    vi.useFakeTimers();
    render(
      <ProveedorAvisos>
        <Disparador mensaje="Pausable" />
      </ProveedorAvisos>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notificar Pausable" }));
    const item = screen.getByText("Pausable").parentElement as HTMLElement;

    fireEvent.mouseEnter(item);
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.queryAllByText("Pausable")).toHaveLength(1);

    fireEvent.mouseLeave(item);
    act(() => vi.advanceTimersByTime(5100));
    expect(screen.queryAllByText("Pausable")).toHaveLength(0);
  });

  it("no deja temporizadores pendientes al desmontar", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <ProveedorAvisos>
        <Disparador mensaje="Pendiente" />
      </ProveedorAvisos>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Notificar Pendiente" }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("lanza un error claro si se usa fuera del proveedor", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Disparador mensaje="x" />)).toThrow(
      "useAvisos debe usarse dentro de ProveedorAvisos",
    );
    error.mockRestore();
  });
});

describe("Pestania", () => {
  const pestanias = [
    { id: "a", etiqueta: "Uno", contenido: "Panel uno" },
    { id: "b", etiqueta: "Dos", contenido: "Panel dos" },
    { id: "c", etiqueta: "Tres", contenido: "Panel tres" },
  ];

  it("muestra solo el panel activo y usa roving tabindex", () => {
    render(<Pestania pestanias={pestanias} ariaLabel="Secciones" />);
    const uno = screen.getByRole("tab", { name: "Uno" });
    expect(uno.getAttribute("aria-selected")).toBe("true");
    expect(uno.tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Dos" }).tabIndex).toBe(-1);
    expect(screen.getByRole("tabpanel").textContent).toBe("Panel uno");
  });

  it("las flechas mueven foco y selección con vuelta circular", async () => {
    render(<Pestania pestanias={pestanias} />);
    screen.getByRole("tab", { name: "Uno" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Dos" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Panel dos");

    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Uno" }));

    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Tres" }));
    expect(screen.getByRole("tab", { name: "Tres" }).tabIndex).toBe(0);
    expect(screen.getByRole("tab", { name: "Uno" }).tabIndex).toBe(-1);
  });

  it("Inicio y Fin saltan a la primera y a la última pestaña", async () => {
    render(<Pestania pestanias={pestanias} inicial="b" />);
    screen.getByRole("tab", { name: "Dos" }).focus();

    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Tres" }));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Uno" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Panel uno");
  });

  it("el clic también cambia de pestaña", async () => {
    render(<Pestania pestanias={pestanias} />);
    await userEvent.click(screen.getByRole("tab", { name: "Tres" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Panel tres");
  });
});

describe("Tabla", () => {
  it("muestra título, descripción y las filas", () => {
    render(
      <Tabla titulo="Proyectos" descripcion="Activos del mes">
        <thead>
          <tr>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Alfa</td>
          </tr>
        </tbody>
      </Tabla>,
    );
    expect(screen.getByRole("heading", { name: "Proyectos" })).toBeTruthy();
    expect(screen.getByText("Activos del mes")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Alfa" })).toBeTruthy();
  });

  it("no renderiza encabezado si no hay título ni descripción", () => {
    render(
      <Tabla>
        <tbody>
          <tr>
            <td>Sola</td>
          </tr>
        </tbody>
      </Tabla>,
    );
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
