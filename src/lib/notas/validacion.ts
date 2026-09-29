import { z } from "zod";
import { fechaDeClave, hoyComoFecha, sumarDias } from "@/lib/notas/periodo";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";

// Las entradas de bitácora no pueden ser anteriores al año 2000
const FECHA_MINIMA = new Date(Date.UTC(2000, 0, 1));

export const LIMITES_NOTA = {
  texto: 5000,
  proximoPaso: 500,
  minutosMinimo: 1,
  minutosMaximo: 1440,
} as const;

export type CamposNota = "texto" | "proyectoId" | "fecha" | "proximoPaso" | "minutos";
export type ErroresNota = Partial<Record<CamposNota, string>>;

export type DatosNota = {
  proyectoId: string;
  fecha: Date;
  texto: string;
  proximoPaso: string;
  minutos: number | null;
};

export type EntradaNota = {
  texto: unknown;
  proyectoId: unknown;
  proximoPaso?: unknown;
  minutos?: unknown;
};

export function esquemaNota() {
  return z.object({
    texto: z
      .string()
      .trim()
      .min(1, "El texto es obligatorio.")
      .max(LIMITES_NOTA.texto, `La nota admite hasta ${LIMITES_NOTA.texto} caracteres.`),
    proximoPaso: z
      .string()
      .trim()
      .min(1, "Indica el próximo paso para poder retomar el trabajo.")
      .max(
        LIMITES_NOTA.proximoPaso,
        `El próximo paso admite hasta ${LIMITES_NOTA.proximoPaso} caracteres.`,
      ),
    proyectoId: z.string().min(1, "El proyecto es obligatorio."),
  });
}

export type ResultadoValidacion =
  { ok: true; datos: DatosNota } | { ok: false; errores: ErroresNota };

type ResultadoMinutos = { ok: true; minutos: number | null } | { ok: false; error: string };

// Minutos opcionales: vacío es válido; si hay valor debe ser un entero entre 1 y 1440
export function leerMinutos(valor: unknown): ResultadoMinutos {
  const texto = typeof valor === "string" ? valor.trim() : "";
  if (texto === "") return { ok: true, minutos: null };
  const { minutosMinimo: min, minutosMaximo: max } = LIMITES_NOTA;
  if (!/^\d+$/.test(texto)) {
    return { ok: false, error: "Escribe los minutos como número entero, por ejemplo 90." };
  }
  const minutos = Number(texto);
  if (minutos < min || minutos > max) {
    return { ok: false, error: `El tiempo debe estar entre ${min} y ${max} minutos.` };
  }
  return { ok: true, minutos };
}

export function validarNota(
  entrada: EntradaNota,
  fecha: string,
  ahora: Date = new Date(),
): ResultadoValidacion {
  const resultado = esquemaNota().safeParse({
    texto: typeof entrada.texto === "string" ? entrada.texto : "",
    proximoPaso: typeof entrada.proximoPaso === "string" ? entrada.proximoPaso : "",
    proyectoId: typeof entrada.proyectoId === "string" ? entrada.proyectoId : "",
  });

  const errores: ErroresNota = {};
  if (!resultado.success) {
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CamposNota;
      errores[campo] ??= problema.message;
    }
  }

  const fechaPura = fechaDeClave(fecha.trim());
  if (!fechaPura) errores.fecha = "La fecha no es válida.";
  else if (fechaPura < FECHA_MINIMA) errores.fecha = "La fecha no puede ser anterior al año 2000.";
  else if (fechaPura > sumarDias(hoyComoFecha(leerEntornoTiempo().TZ, ahora), 1)) {
    errores.fecha = "La fecha no puede ser posterior a mañana.";
  }

  const minutos = leerMinutos(entrada.minutos);
  if (!minutos.ok) errores.minutos = minutos.error;

  if (!resultado.success || !fechaPura || errores.fecha || !minutos.ok) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    datos: {
      texto: resultado.data.texto,
      proximoPaso: resultado.data.proximoPaso,
      proyectoId: resultado.data.proyectoId,
      fecha: fechaPura,
      minutos: minutos.minutos,
    },
  };
}
