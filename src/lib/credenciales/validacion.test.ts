import { describe, expect, it } from "vitest";
import { LIMITES_CREDENCIAL, validarCredencial } from "@/lib/credenciales/validacion";

const base = {
  nombre: "GoAnywhere",
  categoria: "SERVIDOR",
  usuario: "",
  secreto: "s3creto ",
  host: "",
  nota: "",
  global: false,
  proyectoIds: ["p1"],
};
const crear = { secretoObligatorio: true };
const editar = { secretoObligatorio: false };

describe("validarCredencial", () => {
  it("recorta lo opcional pero conserva el secreto tal cual", () => {
    const resultado = validarCredencial({ ...base, nombre: "  GoAnywhere  " }, crear);
    expect(resultado).toEqual({
      ok: true,
      datos: {
        nombre: "GoAnywhere",
        categoria: "SERVIDOR",
        usuario: null,
        secreto: "s3creto ",
        host: null,
        nota: null,
        global: false,
        proyectoIds: ["p1"],
      },
    });
  });

  it("exige el secreto al crear y lo deja opcional al editar", () => {
    expect(validarCredencial({ ...base, secreto: "" }, crear)).toMatchObject({
      ok: false,
      errores: { secreto: expect.any(String) },
    });
    expect(validarCredencial({ ...base, secreto: "" }, editar)).toMatchObject({
      ok: true,
      datos: { secreto: null },
    });
  });

  it("exige el nombre y una categoría existente", () => {
    const resultado = validarCredencial({ ...base, nombre: "  ", categoria: "INVENTADA" }, crear);
    expect(resultado).toMatchObject({
      ok: false,
      errores: { nombre: expect.any(String), categoria: expect.any(String) },
    });
  });

  it("rechaza textos por encima del máximo", () => {
    const resultado = validarCredencial(
      { ...base, nota: "n".repeat(LIMITES_CREDENCIAL.nota + 1), secreto: "x".repeat(2001) },
      crear,
    );
    expect(resultado).toMatchObject({
      ok: false,
      errores: { nota: expect.any(String), secreto: expect.any(String) },
    });
  });

  it("no incluye el secreto en los mensajes de error", () => {
    const resultado = validarCredencial({ ...base, secreto: "x".repeat(2001), nombre: "" }, crear);
    expect(JSON.stringify(resultado)).not.toContain("xxxxx");
  });

  it("una credencial global descarta los proyectos", () => {
    const resultado = validarCredencial(
      { ...base, global: true, proyectoIds: ["p1", "p2"] },
      crear,
    );
    expect(resultado).toMatchObject({ ok: true, datos: { global: true, proyectoIds: [] } });
  });

  it("acepta varios proyectos, sin repetidos ni valores que no son texto", () => {
    const resultado = validarCredencial({ ...base, proyectoIds: ["p1", "p2", "p1", 5, ""] }, crear);
    expect(resultado).toMatchObject({ ok: true, datos: { proyectoIds: ["p1", "p2"] } });
  });

  it("trata valores que no son texto como vacíos", () => {
    const resultado = validarCredencial({ ...base, nombre: 5, secreto: {} }, crear);
    expect(resultado).toMatchObject({ ok: false, errores: { nombre: expect.any(String) } });
  });
});
