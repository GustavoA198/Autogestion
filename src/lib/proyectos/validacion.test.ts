import { describe, expect, it } from "vitest";
import {
  LIMITES_PROYECTO,
  validarEnlacesProyecto,
  validarProyecto,
} from "@/lib/proyectos/validacion";

const base = { nombre: "Cliente Norte", descripcion: "" };

describe("validarProyecto", () => {
  it("recorta el nombre y convierte los opcionales vacíos en null", () => {
    const resultado = validarProyecto({ ...base, nombre: "  Cliente Norte  " });
    expect(resultado).toEqual({
      ok: true,
      datos: { nombre: "Cliente Norte", descripcion: null },
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

  it("trata valores que no son texto como vacíos", () => {
    const resultado = validarProyecto({ nombre: "X", descripcion: 5 });
    expect(resultado).toEqual({ ok: true, datos: { nombre: "X", descripcion: null } });
  });
});

describe("validarEnlacesProyecto", () => {
  it("acepta una lista vacía", () => {
    expect(validarEnlacesProyecto([])).toEqual({ ok: true, enlaces: [] });
  });

  it("recorta los textos y descarta las filas vacías del todo", () => {
    const resultado = validarEnlacesProyecto([
      { nombre: "  SharePoint ", url: " https://empresa.sharepoint.com/sitio " },
      { nombre: "", url: "   " },
      { nombre: "Repo", url: "http://localhost:3000/docs" },
    ]);
    expect(resultado).toEqual({
      ok: true,
      enlaces: [
        { nombre: "SharePoint", url: "https://empresa.sharepoint.com/sitio" },
        { nombre: "Repo", url: "http://localhost:3000/docs" },
      ],
    });
  });

  it("exige nombre y dirección cuando la fila tiene algo", () => {
    const resultado = validarEnlacesProyecto([
      { nombre: "Solo nombre", url: "" },
      { nombre: "", url: "https://example.com" },
    ]);
    expect(resultado).toEqual({
      ok: false,
      errores: {
        0: { url: expect.any(String) },
        1: { nombre: expect.any(String) },
      },
    });
  });

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<b>x</b>",
    "file:///etc/passwd",
    "ftp://servidor/archivo",
    "sin-esquema.com",
    "https//roto",
  ])("rechaza la dirección %s", (url) => {
    const resultado = validarEnlacesProyecto([{ nombre: "Docs", url }]);
    expect(resultado).toMatchObject({ ok: false, errores: { 0: { url: expect.any(String) } } });
  });

  it("indexa el error por la posición de la fila enviada, contando las vacías", () => {
    const resultado = validarEnlacesProyecto([
      { nombre: "", url: "" },
      { nombre: "Docs", url: "javascript:alert(1)" },
    ]);
    expect(resultado).toMatchObject({ ok: false, errores: { 1: { url: expect.any(String) } } });
  });

  it("rechaza nombre y dirección por encima del máximo", () => {
    const resultado = validarEnlacesProyecto([
      {
        nombre: "a".repeat(LIMITES_PROYECTO.enlaceNombre + 1),
        url: `https://example.com/${"b".repeat(LIMITES_PROYECTO.enlaceUrl)}`,
      },
    ]);
    expect(resultado).toMatchObject({
      ok: false,
      errores: { 0: { nombre: expect.any(String), url: expect.any(String) } },
    });
  });

  it("trata valores que no son texto como vacíos", () => {
    expect(validarEnlacesProyecto([{ nombre: 5, url: {} }])).toEqual({ ok: true, enlaces: [] });
  });

  it("rechaza más filas que el tope", () => {
    const filas = Array.from({ length: LIMITES_PROYECTO.enlaces + 1 }, (_, i) => ({
      nombre: `Enlace ${i}`,
      url: "https://example.com",
    }));
    expect(validarEnlacesProyecto(filas)).toMatchObject({
      ok: false,
      general: expect.any(String),
    });
    expect(validarEnlacesProyecto(filas.slice(0, LIMITES_PROYECTO.enlaces)).ok).toBe(true);
  });
});
