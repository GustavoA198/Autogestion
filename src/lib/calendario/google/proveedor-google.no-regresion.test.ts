// Test de no regresión: verifica que Google proveedor sigue exportando las mismas firmas.
// Si esto falla, la HU-17 rompió la compatibilidad con HU-10.
import { describe, expect, it } from "vitest";
import * as googleMod from "./proveedor-google";

describe("No regresión: proveedor-google exports", () => {
  it("exporta GoogleProveedor como clase", () => {
    expect(typeof googleMod.GoogleProveedor).toBe("function");
  });

  it("exporta obtenerGoogleProveedor como función", () => {
    expect(typeof googleMod.obtenerGoogleProveedor).toBe("function");
  });

  it("GoogleProveedor tiene los métodos esperados", () => {
    const proto = googleMod.GoogleProveedor.prototype;
    expect(typeof proto.listarEventos).toBe("function");
    expect(typeof proto.crearEvento).toBe("function");
    expect(typeof proto.refreshTokens).toBe("function");
    expect(typeof proto.estaConfigurado).toBe("function");
    expect(typeof proto.generarUrlAutenticacion).toBe("function");
    expect(typeof proto.guardarTokensDesdeCode).toBe("function");
  });

  it("obtenerGoogleProveedor devuelve instancia de GoogleProveedor", () => {
    const inst = googleMod.obtenerGoogleProveedor();
    expect(inst).toBeInstanceOf(googleMod.GoogleProveedor);
  });

  it("no se introdujeron nuevos exports que rompan la API pública", () => {
    const exports = Object.keys(googleMod);
    expect(exports).toContain("GoogleProveedor");
    expect(exports).toContain("obtenerGoogleProveedor");
  });
});
