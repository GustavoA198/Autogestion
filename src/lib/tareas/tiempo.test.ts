// Pruebas de la zona horaria del entorno: una zona inválida no debe llegar a Intl.
import { describe, expect, it } from "vitest";
import { leerEntornoTiempo } from "./tiempo";

describe("leerEntornoTiempo", () => {
  it("respeta una zona valida del entorno", () => {
    expect(leerEntornoTiempo({ TZ: "Europe/Madrid" }).TZ).toBe("Europe/Madrid");
  });

  it("usa la zona predeterminada cuando no viene ninguna", () => {
    expect(leerEntornoTiempo({}).TZ).toBe("America/Bogota");
  });

  it("rechaza la zona corrupta que produjo el 500 en produccion", () => {
    expect(leerEntornoTiempo({ TZ: ":UTC" }).TZ).toBe("America/Bogota");
  });

  it("rechaza una zona vacia, que Zod acepta como cadena", () => {
    expect(leerEntornoTiempo({ TZ: "" }).TZ).toBe("America/Bogota");
  });

  it("rechaza un texto que no es una zona horaria", () => {
    expect(leerEntornoTiempo({ TZ: "Bogota" }).TZ).toBe("America/Bogota");
  });

  it("acepta UTC, que es una zona valida", () => {
    expect(leerEntornoTiempo({ TZ: "UTC" }).TZ).toBe("UTC");
  });

  it("siempre devuelve una zona que Intl puede construir", () => {
    const zona = leerEntornoTiempo({ TZ: ":UTC" }).TZ;
    expect(() => new Intl.DateTimeFormat("es-CO", { timeZone: zona })).not.toThrow();
  });
});
