import { z } from "zod";

export const LIMITES_PROYECTO = {
  nombre: 80,
  descripcion: 300,
  enlaceNombre: 80,
  enlaceUrl: 2000,
  enlaces: 20,
} as const;

export type CamposProyecto = "nombre" | "descripcion";
// La clave enlaces lleva el error general de la lista (por ejemplo, demasiadas filas)
export type ErroresProyecto = Partial<Record<CamposProyecto | "enlaces", string>>;
export type DatosProyecto = {
  nombre: string;
  descripcion: string | null;
};

export type EnlaceProyecto = { nombre: string; url: string };
export type ErroresEnlacesProyecto = Record<number, { nombre?: string; url?: string }>;
export type ResultadoEnlaces =
  | { ok: true; enlaces: EnlaceProyecto[] }
  | { ok: false; errores: ErroresEnlacesProyecto; general?: string };

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
  });
  if (resultado.success) return { ok: true, datos: resultado.data };

  const errores: ErroresProyecto = {};
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0] as CamposProyecto;
    errores[campo] ??= problema.message;
  }
  return { ok: false, errores };
}

// Valida las filas de enlaces; las filas vacías del todo se descartan y el índice del error es el de la fila enviada
export function validarEnlacesProyecto(filas: { nombre: unknown; url: unknown }[]): ResultadoEnlaces {
  const enlaces: EnlaceProyecto[] = [];
  const errores: ErroresEnlacesProyecto = {};

  filas.forEach((fila, indice) => {
    const nombre = comoTexto(fila.nombre).trim();
    const url = comoTexto(fila.url).trim();
    if (nombre === "" && url === "") return;

    const error: { nombre?: string; url?: string } = {};
    if (nombre === "") error.nombre = "El nombre del enlace es obligatorio.";
    else if (nombre.length > LIMITES_PROYECTO.enlaceNombre) {
      error.nombre = `El nombre admite hasta ${LIMITES_PROYECTO.enlaceNombre} caracteres.`;
    }
    if (url === "") error.url = "La dirección es obligatoria.";
    else if (url.length > LIMITES_PROYECTO.enlaceUrl) {
      error.url = `La dirección admite hasta ${LIMITES_PROYECTO.enlaceUrl} caracteres.`;
    } else if (!esUrlWeb(url)) {
      error.url = "La dirección debe ser una URL válida que empiece con http:// o https://.";
    }

    if (error.nombre || error.url) errores[indice] = error;
    else enlaces.push({ nombre, url });
  });

  if (enlaces.length > LIMITES_PROYECTO.enlaces) {
    return {
      ok: false,
      errores,
      general: `Puedes guardar hasta ${LIMITES_PROYECTO.enlaces} enlaces por proyecto.`,
    };
  }
  if (Object.keys(errores).length > 0) return { ok: false, errores };
  return { ok: true, enlaces };
}
