import { describe, expect, it } from "vitest";
import { generarHash, igualesSeguro, verificarClave } from "@/lib/auth/clave";

describe("generarHash y verificarClave", () => {
  it("genera un hash con el formato esperado y sin caracteres que rompan un .env", async () => {
    const hash = await generarHash("una-clave-segura-123");
    expect(hash).toMatch(/^scrypt:15:8:3:[\w-]+:[\w-]+$/);
    expect(hash).not.toMatch(/[$\s"'#]/);
  });

  it("acepta la clave correcta y rechaza una incorrecta", async () => {
    const hash = await generarHash("una-clave-segura-123");
    expect(await verificarClave("una-clave-segura-123", hash)).toBe(true);
    expect(await verificarClave("otra-clave-distinta", hash)).toBe(false);
  });

  it("usa una sal distinta en cada hash de la misma clave", async () => {
    const [a, b] = await Promise.all([
      generarHash("misma-clave-123"),
      generarHash("misma-clave-123"),
    ]);
    expect(a).not.toBe(b);
  });

  it("no incluye la clave en texto plano dentro del hash", async () => {
    const hash = await generarHash("clave-visible-123");
    expect(hash).not.toContain("clave-visible-123");
  });

  it.each([
    ["vacío", ""],
    ["texto plano", "clave-en-texto-plano"],
    ["algoritmo distinto", "bcrypt:15:8:3:c2FsdHNhbHRzYWx0:aGFzaGhhc2hoYXNoaGFzaA"],
    ["parámetros no numéricos", "scrypt:a:b:c:c2FsdHNhbHRzYWx0:aGFzaGhhc2hoYXNoaGFzaA"],
    ["costo excesivo", "scrypt:30:8:3:c2FsdHNhbHRzYWx0:aGFzaGhhc2hoYXNoaGFzaA"],
    ["hash demasiado corto", "scrypt:15:8:3:c2FsdHNhbHRzYWx0:YQ"],
    ["partes de más", "scrypt:15:8:3:c2FsdHNhbHRzYWx0:aGFzaGhhc2hoYXNoaGFzaA:extra"],
  ])("rechaza un hash mal formado (%s) sin lanzar errores", async (_nombre, almacenado) => {
    expect(await verificarClave("cualquier-clave", almacenado)).toBe(false);
  });
});

describe("igualesSeguro", () => {
  it("compara textos iguales y distintos", () => {
    expect(igualesSeguro("gustavo", "gustavo")).toBe(true);
    expect(igualesSeguro("gustavo", "Gustavo")).toBe(false);
  });

  it("funciona con textos de distinta longitud", () => {
    expect(igualesSeguro("a", "un-texto-mucho-mas-largo")).toBe(false);
  });
});
