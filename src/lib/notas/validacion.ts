import { z } from "zod";

export const LIMITES_NOTA = {
  texto: 5000,
} as const;

export type CamposNota = "texto" | "proyectoId";
export type ErroresNota = Partial<Record<CamposNota, string>>;

export type DatosNota = {
  proyectoId: string;
  fecha: Date;
  texto: string;
};

export type EntradaNota = Record<CamposNota, unknown>;

export function esquemaNota() {
  return z.object({
    texto: z
      .string()
      .trim()
      .min(1, "El texto es obligatorio.")
      .max(LIMITES_NOTA.texto, `La nota admite hasta ${LIMITES_NOTA.texto} caracteres.`),
    proyectoId: z.string().min(1, "El proyecto es obligatorio."),
  });
}

export type ResultadoValidacion =
  { ok: true; datos: DatosNota } | { ok: false; errores: ErroresNota };

export function validarNota(entrada: EntradaNota, fecha: string): ResultadoValidacion {
  const resultado = esquemaNota().safeParse({
    texto: typeof entrada.texto === "string" ? entrada.texto : "",
    proyectoId: typeof entrada.proyectoId === "string" ? entrada.proyectoId : "",
  });

  if (!resultado.success) {
    const errores: ErroresNota = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CamposNota;
      errores[campo] ??= problema.message;
    }
    return { ok: false, errores };
  }

  const fechaParsed = new Date(fecha);
  if (isNaN(fechaParsed.getTime())) {
    return { ok: false, errores: { texto: "La fecha no es válida." } };
  }

  return {
    ok: true,
    datos: {
      texto: resultado.data.texto,
      proyectoId: resultado.data.proyectoId,
      fecha: fechaParsed,
    },
  };
}
