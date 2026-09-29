import { describe, expect, it } from "vitest";
import { CLAVE_TEMA, SCRIPT_TEMA_INICIAL } from "@/lib/tema";

function ejecutarScript(almacen: { getItem: (clave: string) => string | null }) {
  const atributos: Record<string, string> = {};
  const documento = {
    documentElement: {
      setAttribute: (nombre: string, valor: string) => (atributos[nombre] = valor),
    },
  };
  new Function("localStorage", "document", SCRIPT_TEMA_INICIAL)(almacen, documento);
  return atributos;
}

describe("script de tema inicial", () => {
  it("aplica el tema oscuro o claro guardado", () => {
    expect(ejecutarScript({ getItem: () => "oscuro" })).toEqual({
      "data-theme": "autogestion-oscuro",
    });
    expect(ejecutarScript({ getItem: () => "claro" })).toEqual({
      "data-theme": "autogestion-claro",
    });
  });

  it("consulta la clave de preferencia y no hace nada con valores desconocidos o vacíos", () => {
    let consultada = "";
    const atributos = ejecutarScript({
      getItem: (clave) => {
        consultada = clave;
        return "sistema";
      },
    });
    expect(consultada).toBe(CLAVE_TEMA);
    expect(atributos).toEqual({});
    expect(ejecutarScript({ getItem: () => null })).toEqual({});
  });

  it("no lanza si el almacenamiento está bloqueado", () => {
    const bloqueado = {
      getItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(() => ejecutarScript(bloqueado)).not.toThrow();
    expect(ejecutarScript(bloqueado)).toEqual({});
  });
});
