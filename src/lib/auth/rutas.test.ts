import { describe, expect, it } from "vitest";
import { esRutaPublica, rutaDestinoSegura } from "@/lib/auth/rutas";

describe("esRutaPublica", () => {
  it.each([
    "/login",
    "/api/health",
    "/api/auth",
    "/api/auth/signin",
    "/api/auth/callback/credentials",
  ])("permite %s sin sesión", (ruta) => expect(esRutaPublica(ruta)).toBe(true));

  it.each([
    "/",
    "/proyectos",
    "/api/proyectos",
    "/loginx",
    "/login/otra",
    "/api/healthz",
    "/api/authx",
    "/api/health/detalle",
  ])("exige sesión en %s", (ruta) => expect(esRutaPublica(ruta)).toBe(false));
});

describe("rutaDestinoSegura", () => {
  it.each([
    ["/proyectos", "/proyectos"],
    ["/proyectos?filtro=a", "/proyectos?filtro=a"],
    ["/", "/"],
  ])("conserva la ruta interna %s", (entrada, esperado) => {
    expect(rutaDestinoSegura(entrada)).toBe(esperado);
  });

  it.each([
    ["ausente", undefined],
    ["nula", null],
    ["vacía", ""],
    ["URL externa", "https://sitio-malicioso.com"],
    ["protocolo relativo", "//sitio-malicioso.com"],
    ["barra invertida", "/\\sitio-malicioso.com"],
    ["ruta relativa", "proyectos"],
    ["salto de línea", "/ruta\nSet-Cookie: x=1"],
    ["esquema javascript", "javascript:alert(1)"],
    ["bucle al login", "/login"],
    ["bucle al login con parámetros", "/login?callbackUrl=/"],
  ])("cae a la raíz con una entrada insegura (%s)", (_nombre, entrada) => {
    expect(rutaDestinoSegura(entrada)).toBe("/");
  });
});
