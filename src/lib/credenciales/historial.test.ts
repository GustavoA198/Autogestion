import { describe, expect, it } from "vitest";
import { camposCambiados, type EstadoCredencial } from "@/lib/credenciales/historial";

const actual: EstadoCredencial = {
  nombre: "GoAnywhere",
  categoria: "SERVIDOR",
  usuario: "admin",
  host: null,
  nota: null,
  global: false,
  proyectoIds: ["p1", "p2"],
};

describe("camposCambiados", () => {
  it("no registra nada si no cambió ningún campo", () => {
    expect(camposCambiados(actual, { ...actual, proyectoIds: ["p2", "p1"] }, false)).toEqual([]);
  });

  it("registra solo los nombres de los campos que cambiaron", () => {
    const nuevo = { ...actual, nombre: "GoAnywhere PRD", host: "https://ga.example.com" };
    expect(camposCambiados(actual, nuevo, false)).toEqual(["nombre", "host o URL"]);
  });

  it("registra el secreto solo cuando se escribe uno nuevo", () => {
    expect(camposCambiados(actual, actual, true)).toEqual(["secreto"]);
  });

  it("detecta cambios de alcance por global o por proyectos", () => {
    expect(camposCambiados(actual, { ...actual, global: true, proyectoIds: [] }, false)).toEqual([
      "alcance",
    ]);
    expect(camposCambiados(actual, { ...actual, proyectoIds: ["p1"] }, false)).toEqual(["alcance"]);
  });

  it("nunca incluye los valores, ni viejos ni nuevos", () => {
    const nuevo = { ...actual, usuario: "otro-usuario", nota: "detalle privado" };
    const texto = JSON.stringify(camposCambiados(actual, nuevo, true));
    for (const valor of ["admin", "otro-usuario", "detalle privado"]) {
      expect(texto).not.toContain(valor);
    }
  });
});
