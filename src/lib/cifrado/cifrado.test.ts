import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cifrar, descifrar } from "@/lib/cifrado/cifrado";

const clave = randomBytes(32);

describe("cifrado autenticado", () => {
  it("recupera el texto original, incluidos espacios y caracteres especiales", () => {
    const texto = "  Clave ñandú 🔑 con espacios  ";
    expect(descifrar(cifrar(texto, clave), clave)).toBe(texto);
  });

  it("usa un IV distinto en cada cifrado", () => {
    const a = cifrar("mismo", clave);
    const b = cifrar("mismo", clave);
    expect(a).not.toBe(b);
    expect(a.split(":")[1]).not.toBe(b.split(":")[1]);
  });

  it("almacena con el formato versionado v1:iv:etiqueta:cifrado sin el texto en claro", () => {
    const almacenado = cifrar("secreto-visible", clave);
    expect(almacenado).toMatch(/^v1:[\w-]+:[\w-]+:[\w-]*$/);
    expect(almacenado).not.toContain("secreto-visible");
  });

  it("detecta el dato manipulado", () => {
    const [version, iv, etiqueta, cifrado] = cifrar("secreto", clave).split(":");
    const alterado = Buffer.from(cifrado!, "base64url");
    alterado[0] = (alterado[0] ?? 0) ^ 1;
    const manipulado = [version, iv, etiqueta, alterado.toString("base64url")].join(":");
    expect(() => descifrar(manipulado, clave)).toThrow(/No se pudo descifrar/);
  });

  it("falla con una clave incorrecta sin revelar el texto", () => {
    const almacenado = cifrar("secreto-muy-privado", clave);
    expect(() => descifrar(almacenado, randomBytes(32))).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("secreto-muy-privado") }),
    );
  });

  it.each(["", "texto", "v2:a:b:c", "v1:a:b", "v1:a:b:c:d"])("rechaza el formato %j", (valor) => {
    expect(() => descifrar(valor, clave)).toThrow(/No se pudo descifrar/);
  });
});
