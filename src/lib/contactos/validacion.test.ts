import { describe, expect, it } from "vitest";
import { LIMITES_CONTACTO, validarContacto } from "@/lib/contactos/validacion";

const base = {
  nombre: "Laura García",
  correo: "laura@ejemplo.com",
  telefono: "",
  empresaOCargo: "",
  nota: "",
  global: false,
  proyectoIds: ["p1"],
};

describe("validarContacto", () => {
  it("recorta espacios en texto opcional y convierte vacios en null", () => {
    const resultado = validarContacto({ ...base, nombre: "  Laura García  ", telefono: " 911 " });
    expect(resultado).toEqual({
      ok: true,
      datos: {
        nombre: "Laura García",
        correo: "laura@ejemplo.com",
        telefono: "911",
        empresaOCargo: null,
        nota: null,
        global: false,
        proyectoIds: ["p1"],
      },
    });
  });

  it("exige nombre y correo valido", () => {
    const resultado = validarContacto({ ...base, nombre: "  ", correo: "no-es-email" });
    expect(resultado).toMatchObject({
      ok: false,
      errores: { nombre: expect.any(String), correo: expect.any(String) },
    });
  });

  it("acepta correos validos", () => {
    const validos = ["a@b.com", "usuario+nombre@dominio.es", "user123@sub.dominio.com"];
    for (const correo of validos) {
      const resultado = validarContacto({ ...base, correo });
      expect(resultado).toMatchObject({ ok: true, datos: { correo } });
    }
  });

  it("rechaza telefono con caracteres invalidos", () => {
    const resultado = validarContacto({ ...base, telefono: "abc-123!" });
    expect(resultado).toMatchObject({
      ok: false,
      errores: { telefono: expect.any(String) },
    });
  });

  it("acepta telefono valido con mas y espacios", () => {
    const resultado = validarContacto({ ...base, telefono: "+54 9 11 1234-5678" });
    expect(resultado).toMatchObject({ ok: true, datos: { telefono: "+54 9 11 1234-5678" } });
  });

  it("rechaza textos por encima del maximo", () => {
    const resultado = validarContacto({
      ...base,
      nombre: "n".repeat(LIMITES_CONTACTO.nombre + 1),
      correo: "a@b.com",
    });
    expect(resultado).toMatchObject({
      ok: false,
      errores: { nombre: expect.any(String) },
    });
  });

  it("descarta proyectos de contacto global", () => {
    const resultado = validarContacto({ ...base, global: true, proyectoIds: ["p1", "p2"] });
    expect(resultado).toMatchObject({ ok: true, datos: { global: true, proyectoIds: [] } });
  });

  it("deduce ids de proyecto repetidos o invalidos", () => {
    const resultado = validarContacto({ ...base, proyectoIds: ["p1", "p2", "p1", 5, ""] });
    expect(resultado).toMatchObject({ ok: true, datos: { proyectoIds: ["p1", "p2"] } });
  });

  it("trata valores que no son texto como vacios", () => {
    const resultado = validarContacto({ ...base, nombre: 5, correo: {} });
    expect(resultado).toMatchObject({
      ok: false,
      errores: { nombre: expect.any(String), correo: expect.any(String) },
    });
  });
});
