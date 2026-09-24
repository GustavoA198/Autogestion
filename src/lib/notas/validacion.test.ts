import { describe, expect, it } from "vitest";
import { validarNota } from "@/lib/notas/validacion";

describe("validarNota", () => {
  it("texto obligatorio", () => {
    const resultado = validarNota({ texto: "", proyectoId: "p1" }, "2026-09-20");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores?.texto).toMatch(/obligatorio/i);
  });

  it("texto maximo 5000 caracteres", () => {
    const largo = "a".repeat(5001);
    const resultado = validarNota({ texto: largo, proyectoId: "p1" }, "2026-09-20");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores?.texto).toMatch(/5000/);
  });

  it("proyectoId obligatorio", () => {
    const resultado = validarNota({ texto: "nota", proyectoId: "" }, "2026-09-20");
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores?.proyectoId).toMatch(/obligatorio/i);
  });

  it("fecha invalida", () => {
    const resultado = validarNota({ texto: "nota", proyectoId: "p1" }, "no-es-fecha");
    expect(resultado.ok).toBe(false);
  });

  it("respuesta correcta con datos validos", () => {
    const resultado = validarNota(
      { texto: "Revisión del módulo.", proyectoId: "p1" },
      "2026-09-20",
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.texto).toBe("Revisión del módulo.");
      expect(resultado.datos.proyectoId).toBe("p1");
      expect(resultado.datos.fecha).toBeInstanceOf(Date);
    }
  });

  it("recorta espacios en blanco del texto", () => {
    const resultado = validarNota(
      { texto: "  nota con espacios  ", proyectoId: "p1" },
      "2026-09-20",
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.texto).toBe("nota con espacios");
    }
  });
});
