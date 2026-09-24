import { z } from "zod";
import { FrecuenciaTarea } from "@/generated/prisma/enums";

export const VALORES_FRECUENCIA = Object.values(FrecuenciaTarea) as [string, ...string[]];

export const LIMITES_TAREA = {
  titulo: 200,
  descripcion: 2000,
} as const;

export type CamposTarea =
  | "titulo"
  | "descripcion"
  | "tipoFrecuencia"
  | "diaSemana"
  | "diaMes"
  | "fechaPuntual"
  | "proyectoId";
export type ErroresTarea = Partial<Record<CamposTarea, string>>;

export type DatosTarea = {
  titulo: string;
  descripcion: string | null;
  tipoFrecuencia: (typeof FrecuenciaTarea)[keyof typeof FrecuenciaTarea];
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
  proyectoId: string | null;
  activa: boolean;
};

export type EntradaTarea = Record<Exclude<CamposTarea, "proyectoId">, unknown> & {
  proyectoId: unknown;
};

export type ResultadoValidacion =
  { ok: true; datos: DatosTarea } | { ok: false; errores: ErroresTarea };

function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function diaSemanaParse(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number" && Number.isInteger(valor)) return valor;
  if (typeof valor === "string" && valor !== "") {
    const n = parseInt(valor, 10);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function diaMesParse(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number" && Number.isInteger(valor)) return valor;
  if (typeof valor === "string" && valor !== "") {
    const n = parseInt(valor, 10);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function fechaParse(valor: unknown): Date | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;
  if (typeof valor === "string" && valor !== "") {
    const d = new Date(valor);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function validarTarea(entrada: EntradaTarea): ResultadoValidacion {
  const titulo = comoTexto(entrada.titulo);
  const descripcion = entrada.descripcion;
  const tipoFrecuencia = comoTexto(entrada.tipoFrecuencia);
  const rawDiaSemana = diaSemanaParse(entrada.diaSemana as number | string | null);
  const rawDiaMes = diaMesParse(entrada.diaMes as number | string | null);
  const rawFechaPuntual = fechaParse(entrada.fechaPuntual);
  const rawProyectoId = entrada.proyectoId;
  const proyectoId =
    typeof rawProyectoId === "string" && rawProyectoId !== "" ? rawProyectoId : null;

  // Errores de campo individual
  const errores: ErroresTarea = {};

  if (!titulo) errores.titulo = "El título es obligatorio.";
  else if (titulo.length > LIMITES_TAREA.titulo) {
    errores.titulo = `El título admite hasta ${LIMITES_TAREA.titulo} caracteres.`;
  }

  if (typeof descripcion === "string" && descripcion.length > LIMITES_TAREA.descripcion) {
    errores.descripcion = `La descripción admite hasta ${LIMITES_TAREA.descripcion} caracteres.`;
  }

  if (!tipoFrecuencia || !VALORES_FRECUENCIA.includes(tipoFrecuencia)) {
    errores.tipoFrecuencia = "Elige una frecuencia válida.";
  }

  if (rawDiaSemana !== null && (rawDiaSemana < 0 || rawDiaSemana > 6)) {
    errores.diaSemana = "El día de la semana va de 0 (domingo) a 6 (sábado).";
  }

  if (rawDiaMes !== null && (rawDiaMes < 1 || rawDiaMes > 31)) {
    errores.diaMes = "El día del mes va de 1 a 31.";
  }

  // Validaciones cruzadas
  if (tipoFrecuencia === "SEMANAL" && rawDiaSemana === null) {
    errores.diaSemana = "Indica el día de la semana para tareas semanales.";
  }

  if (tipoFrecuencia === "MENSUAL" && rawDiaMes === null) {
    errores.diaMes = "Indica el día del mes para tareas mensuales.";
  }

  if (tipoFrecuencia === "PUNTUAL" && !rawFechaPuntual) {
    errores.fechaPuntual = "Indica la fecha para tareas puntuales.";
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores };

  return {
    ok: true,
    datos: {
      titulo,
      descripcion: typeof descripcion === "string" && descripcion !== "" ? descripcion : null,
      tipoFrecuencia: tipoFrecuencia as DatosTarea["tipoFrecuencia"],
      diaSemana: tipoFrecuencia === "SEMANAL" ? rawDiaSemana : null,
      diaMes: tipoFrecuencia === "MENSUAL" ? rawDiaMes : null,
      fechaPuntual: tipoFrecuencia === "PUNTUAL" ? rawFechaPuntual : null,
      proyectoId,
      activa: true,
    },
  };
}
