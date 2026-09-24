import { describe, expect, it } from "vitest";
import { LIMITES_PROYECTO, validarProyecto } from "@/lib/proyectos/validacion";

const base = { nombre: "Cliente Norte", descripcion: "", enlaceDocumentacion: "" };

describe("validarProyecto", () => {
  it("recorta el nombre y convierte los opcionales vacíos en null", () => {
    const resultado = validarProyecto({ ...base, nombre: "  Cliente Norte  " });
    expect(resultado).toEqual({
      ok: true,
      datos: { nombre: "Cliente Norte", descripcion: null, enlaceDocumentacion: null },
    });
  });

  it("exige el nombre y rechaza solo espacios", () => {
    for (const nombre of ["", "   ", undefined]) {
      const resultado = validarProyecto({ ...base, nombre });
      expect(resultado).toMatchObject({ ok: false, errores: { nombre: expect.any(String) } });
    }
  });

  it("rechaza nombre y descripción por encima del máximo", () => {
    const resultado = validarProyecto({
      ...base,
      nombre: "a".repeat(LIMITES_PROYECTO.nombre + 1),
      descripcion: "b".repeat(LIMITES_PROYECTO.descripcion + 1),
    });
    expect(resultado).toMatchObject({
      ok: false,
      errores: { nombre: expect.any(String), descripcion: expect.any(String) },
    });
  });

  it("acepta el largo máximo exacto", () => {
    const resultado = validarProyecto({ ...base, nombre: "a".repeat(LIMITES_PROYECTO.nombre) });
    expect(resultado.ok).toBe(true);
  });

  it.each(["https://empresa.sharepoint.com/sitio", "http://localhost:3000/docs"])(
    "acepta el enlace %s",
    (enlaceDocumentacion) => {
      expect(validarProyecto({ ...base, enlaceDocumentacion }).ok).toBe(true);
    },
  );

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<b>x</b>",
    "file:///etc/passwd",
    "ftp://servidor/archivo",
    "sin-esquema.com",
    "https//roto",
  ])("rechaza el enlace %s", (enlaceDocumentacion) => {
    const resultado = validarProyecto({ ...base, enlaceDocumentacion });
    expect(resultado).toMatchObject({
      ok: false,
      errores: { enlaceDocumentacion: expect.any(String) },
    });
  });

  it("trata valores que no son texto como vacíos", () => {
    const resultado = validarProyecto({ nombre: "X", descripcion: 5, enlaceDocumentacion: {} });
    expect(resultado).toEqual({
      ok: true,
      datos: { nombre: "X", descripcion: null, enlaceDocumentacion: null },
    });
  });
});
