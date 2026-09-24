import { describe, expect, it } from "vitest";
import { leerEntorno } from "@/lib/env";

describe("leerEntorno", () => {
  it("acepta una URL de PostgreSQL válida", () => {
    const entorno = leerEntorno({
      DATABASE_URL: "postgresql://u:p@localhost:5432/bd",
    });
    expect(entorno.DATABASE_URL).toBe("postgresql://u:p@localhost:5432/bd");
  });

  it("falla con un mensaje claro cuando falta DATABASE_URL", () => {
    expect(() => leerEntorno({})).toThrow(/DATABASE_URL/);
  });

  it("rechaza una URL que no es de PostgreSQL", () => {
    expect(() => leerEntorno({ DATABASE_URL: "mysql://u:p@localhost/bd" })).toThrow(/DATABASE_URL/);
  });

  it("no incluye el valor de la variable en el mensaje de error", () => {
    const secreto = "mysql://usuario:secreto123@host/bd";
    expect(() => leerEntorno({ DATABASE_URL: secreto })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secreto123") }),
    );
  });
});
