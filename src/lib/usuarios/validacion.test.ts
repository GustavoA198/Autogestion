import { describe, expect, it } from "vitest";
import {
  validarCambioClave,
  validarClaveNueva,
  validarNombreUsuario,
} from "@/lib/usuarios/validacion";

describe("validarNombreUsuario", () => {
  it.each(["gustavo", "g.us.tavo", "gustavo-1", "gustavo@correo", "abc", "a".repeat(50)])(
    "acepta %s",
    (nombre) => {
      expect(validarNombreUsuario(nombre)).toBeNull();
    },
  );

  it.each(["ab", "a".repeat(51), "con espacio", "con/acento", "", "  ", "usuario#1"])(
    "rechaza %j",
    (nombre) => {
      expect(validarNombreUsuario(nombre)).toBeTruthy();
    },
  );

  it("acepta un valor que no es texto sin romperse", () => {
    expect(validarNombreUsuario(undefined)).toBeTruthy();
    expect(validarNombreUsuario(42)).toBeTruthy();
  });
});

describe("validarClaveNueva", () => {
  it("acepta una clave larga suficiente", () => {
    expect(validarClaveNueva("a".repeat(12))).toBeNull();
  });

  it("rechaza una clave corta", () => {
    expect(validarClaveNueva("a".repeat(11))).toMatch(/12/);
  });

  it("no recorta la clave: los espacios cuentan", () => {
    expect(validarClaveNueva("           ")).toBeTruthy();
  });
});

describe("validarCambioClave", () => {
  const valida = { actual: "clave-actual-1234", nueva: "clave-nueva-1234", confirmacion: "clave-nueva-1234" };

  it("acepta un cambio válido y devuelve ambas claves", () => {
    const resultado = validarCambioClave(valida);

    expect(resultado).toEqual({ ok: true, datos: { actual: valida.actual, nueva: valida.nueva } });
  });

  it("exige la contraseña actual", () => {
    const resultado = validarCambioClave({ ...valida, actual: "  " });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.actual).toBeTruthy();
  });

  it("rechaza una nueva demasiado corta", () => {
    const resultado = validarCambioClave({ ...valida, nueva: "corta", confirmacion: "corta" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.nueva).toMatch(/12/);
  });

  it("rechaza repetir la misma contraseña", () => {
    const resultado = validarCambioClave({
      actual: "clave-actual-1234",
      nueva: "clave-actual-1234",
      confirmacion: "clave-actual-1234",
    });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.nueva).toMatch(/distinta/);
  });

  it("rechaza una confirmación que no coincide", () => {
    const resultado = validarCambioClave({ ...valida, confirmacion: "otra-clave-1234" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.confirmacion).toBeTruthy();
  });

  it("acumula los errores de los tres campos", () => {
    const resultado = validarCambioClave({ actual: "", nueva: "corta", confirmacion: "otra" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(Object.keys(resultado.errores).sort()).toEqual(["actual", "confirmacion", "nueva"]);
    }
  });

  it("no propaga la contraseña en el resultado de error", () => {
    const resultado = validarCambioClave({ actual: "secreta-actual-1", nueva: "corta", confirmacion: "x" });

    expect(JSON.stringify(resultado)).not.toContain("secreta-actual-1");
  });
});
