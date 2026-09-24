import { describe, expect, it } from "vitest";
import { leerEntornoAuth, leerEntornoBaseDatos, leerEntornoCifrado } from "@/lib/env";

const AUTH_VALIDO = {
  AUTH_USUARIO: "gustavo",
  AUTH_CLAVE_HASH: "scrypt:15:8:3:c2FsdA:aGFzaA",
  NEXTAUTH_SECRET: "x".repeat(32),
  NEXTAUTH_URL: "http://localhost:3000",
};

describe("leerEntornoBaseDatos", () => {
  it("acepta una URL de PostgreSQL válida", () => {
    const entorno = leerEntornoBaseDatos({ DATABASE_URL: "postgresql://u:p@localhost:5432/bd" });
    expect(entorno.DATABASE_URL).toBe("postgresql://u:p@localhost:5432/bd");
  });

  it("falla con un mensaje claro cuando falta DATABASE_URL", () => {
    expect(() => leerEntornoBaseDatos({})).toThrow(/DATABASE_URL/);
  });

  it("rechaza una URL que no es de PostgreSQL", () => {
    expect(() => leerEntornoBaseDatos({ DATABASE_URL: "mysql://u:p@localhost/bd" })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("no incluye el valor de la variable en el mensaje de error", () => {
    const secreto = "mysql://usuario:secreto123@host/bd";
    expect(() => leerEntornoBaseDatos({ DATABASE_URL: secreto })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secreto123") }),
    );
  });
});

describe("leerEntornoAuth", () => {
  it("acepta una configuración completa y válida", () => {
    expect(leerEntornoAuth(AUTH_VALIDO)).toEqual(AUTH_VALIDO);
  });

  it("nombra todas las variables ausentes", () => {
    expect(() => leerEntornoAuth({})).toThrow(
      /AUTH_USUARIO.*AUTH_CLAVE_HASH.*NEXTAUTH_SECRET.*NEXTAUTH_URL/,
    );
  });

  it("rechaza un secreto de sesión corto", () => {
    expect(() => leerEntornoAuth({ ...AUTH_VALIDO, NEXTAUTH_SECRET: "corto" })).toThrow(
      /NEXTAUTH_SECRET/,
    );
  });

  it("rechaza un hash que no tiene el formato esperado", () => {
    expect(() =>
      leerEntornoAuth({ ...AUTH_VALIDO, AUTH_CLAVE_HASH: "clave-en-texto-plano" }),
    ).toThrow(/AUTH_CLAVE_HASH/);
  });

  it("no incluye los valores en el mensaje de error", () => {
    expect(() =>
      leerEntornoAuth({ ...AUTH_VALIDO, AUTH_CLAVE_HASH: "clave-en-texto-plano" }),
    ).toThrow(expect.objectContaining({ message: expect.not.stringContaining("texto-plano") }));
  });
});

describe("leerEntornoCifrado", () => {
  const clave = Buffer.alloc(32, 7).toString("base64");

  it("decodifica una clave base64 de 32 bytes", () => {
    expect(leerEntornoCifrado({ CLAVE_CIFRADO: clave }).CLAVE_CIFRADO).toHaveLength(32);
  });

  it.each([undefined, "", "no es base64!", Buffer.alloc(16).toString("base64")])(
    "rechaza la clave %j sin revelar su valor",
    (valor) => {
      const accion = () => leerEntornoCifrado({ CLAVE_CIFRADO: valor });
      expect(accion).toThrow(/CLAVE_CIFRADO/);
      if (valor)
        expect(accion).toThrow(
          expect.objectContaining({ message: expect.not.stringContaining(valor) }),
        );
    },
  );
});
