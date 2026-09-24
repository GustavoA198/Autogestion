import { z } from "zod";

export const LIMITES_PROYECTO = { nombre: 80, descripcion: 300, enlace: 500 } as const;

export type CamposProyecto = "nombre" | "descripcion" | "enlaceDocumentacion";
export type ErroresProyecto = Partial<Record<CamposProyecto, string>>;
export type DatosProyecto = {
  nombre: string;
  descripcion: string | null;
  enlaceDocumentacion: string | null;
};

// Solo http/https: cualquier otro esquema (javascript:, data:, file:) se rechaza
function esUrlWeb(valor: string): boolean {
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Recorta y convierte la cadena vacía en null para los campos opcionales
const opcional = (maximo: number, mensajeMaximo: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensajeMaximo)
    .transform((valor) => (valor === "" ? null : valor));

const esquemaProyecto = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(LIMITES_PROYECTO.nombre, `El nombre admite hasta ${LIMITES_PROYECTO.nombre} caracteres.`),
  descripcion: opcional(
    LIMITES_PROYECTO.descripcion,
    `La descripción admite hasta ${LIMITES_PROYECTO.descripcion} caracteres.`,
  ),
  enlaceDocumentacion: opcional(
    LIMITES_PROYECTO.enlace,
    `El enlace admite hasta ${LIMITES_PROYECTO.enlace} caracteres.`,
  ).refine((valor) => valor === null || esUrlWeb(valor), {
    message: "El enlace debe ser una URL válida que empiece con http:// o https://.",
  }),
});

export type ResultadoValidacion =
  { ok: true; datos: DatosProyecto } | { ok: false; errores: ErroresProyecto };

// Los valores que no son texto se tratan como vacíos para que el servidor nunca confíe en el cliente
function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export function validarProyecto(entrada: Record<CamposProyecto, unknown>): ResultadoValidacion {
  const resultado = esquemaProyecto.safeParse({
    nombre: comoTexto(entrada.nombre),
    descripcion: comoTexto(entrada.descripcion),
    enlaceDocumentacion: comoTexto(entrada.enlaceDocumentacion),
  });
  if (resultado.success) return { ok: true, datos: resultado.data };

  const errores: ErroresProyecto = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as CamposProyecto;
    errores[campo] ??= problema.message;
  }
  return { ok: false, errores };
}
