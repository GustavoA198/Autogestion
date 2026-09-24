import { describe, expect, it } from "vitest";
import { validarTarea } from "./validacion";

function entradaBase() {
  return {
    titulo: "Tarea test",
    descripcion: "",
    tipoFrecuencia: "",
    diaSemana: null,
    diaMes: null,
    fechaPuntual: "",
    proyectoId: null,
  };
}

describe("validarTarea", () => {
  it("valida una tarea diaria correcta", () => {
    const entrada = { ...entradaBase(), titulo: "Revisar correo", tipoFrecuencia: "DIARIA" };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.titulo).toBe("Revisar correo");
      expect(resultado.datos.tipoFrecuencia).toBe("DIARIA");
    }
  });

  it("valida una tarea semanal", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Reunión",
      tipoFrecuencia: "SEMANAL",
      diaSemana: "1",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.tipoFrecuencia).toBe("SEMANAL");
      expect(resultado.datos.diaSemana).toBe(1);
    }
  });

  it("valida una tarea mensual día 31", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Reporte",
      tipoFrecuencia: "MENSUAL",
      diaMes: "31",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.tipoFrecuencia).toBe("MENSUAL");
      expect(resultado.datos.diaMes).toBe(31);
    }
  });

  it("valida una tarea puntual", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Cita",
      tipoFrecuencia: "PUNTUAL",
      fechaPuntual: "2026-09-25",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.tipoFrecuencia).toBe("PUNTUAL");
      expect(resultado.datos.fechaPuntual).toBeInstanceOf(Date);
    }
  });

  it("rechaza título vacío", () => {
    const entrada = { ...entradaBase(), titulo: "", tipoFrecuencia: "DIARIA" };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.titulo).toBeDefined();
  });

  it("rechaza título muy largo", () => {
    const entrada = { ...entradaBase(), titulo: "A".repeat(201), tipoFrecuencia: "DIARIA" };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.titulo).toBeDefined();
  });

  it("rechaza frecuencia inválida", () => {
    const entrada = { ...entradaBase(), titulo: "Tarea", tipoFrecuencia: "INVALIDA" };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.tipoFrecuencia).toBeDefined();
  });

  it("rechaza diaSemana null en SEMANAL", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Tarea semanal",
      tipoFrecuencia: "SEMANAL",
      diaSemana: null,
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.diaSemana).toBeDefined();
  });

  it("rechaza diaMes null en MENSUAL", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Tarea mensual",
      tipoFrecuencia: "MENSUAL",
      diaMes: null,
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.diaMes).toBeDefined();
  });

  it("rechaza fechaPuntual vacía en PUNTUAL", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Tarea puntual",
      tipoFrecuencia: "PUNTUAL",
      fechaPuntual: "",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.fechaPuntual).toBeDefined();
  });

  it("rechaza diaSemana fuera de rango", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Tarea",
      tipoFrecuencia: "SEMANAL",
      diaSemana: "7",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.diaSemana).toBeDefined();
  });

  it("rechaza diaMes fuera de rango", () => {
    const entrada = { ...entradaBase(), titulo: "Tarea", tipoFrecuencia: "MENSUAL", diaMes: "32" };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.diaMes).toBeDefined();
  });

  it("limpia campos que no aplican según frecuencia", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Tarea diaria con campos incorrectos",
      tipoFrecuencia: "DIARIA",
      diaSemana: "1",
      diaMes: "15",
      fechaPuntual: "2026-09-25",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.datos.diaSemana).toBeNull();
      expect(resultado.datos.diaMes).toBeNull();
      expect(resultado.datos.fechaPuntual).toBeNull();
    }
  });

  it("acepta descripción nula", () => {
    const entrada = {
      ...entradaBase(),
      titulo: "Tarea",
      descripcion: null,
      tipoFrecuencia: "DIARIA",
    };
    const resultado = validarTarea(entrada);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.datos.descripcion).toBeNull();
  });
});
