import { z } from "zod";
import { VALORES_CATEGORIA, type Categoria } from "@/lib/credenciales/categorias";

export const LIMITES_CREDENCIAL = {
  nombre: 80,
  usuario: 120,
  secreto: 2000,
  host: 300,
  nota: 1000,
  proyectos: 200,
} as const;

export type CamposCredencial =
  "nombre" | "categoria" | "usuario" | "secreto" | "host" | "nota" | "proyectoIds";
export type ErroresCredencial = Partial<Record<CamposCredencial, string>>;

export type DatosCredencial = {
  nombre: string;
  categoria: Categoria;
  usuario: string | null;
  host: string | null;
  nota: string | null;
  global: boolean;
  // Vacío cuando la credencial es global
  proyectoIds: string[];
  // Null al editar significa conservar el secreto actual
  secreto: string | null;
};

export type EntradaCredencial = Record<Exclude<CamposCredencial, "proyectoIds">, unknown> & {
  global: unknown;
  proyectoIds: unknown;
};

// Recorta y convierte la cadena vacía en null para los campos opcionales
const opcional = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => (valor === "" ? null : valor));

function esquema(secretoObligatorio: boolean) {
  // El secreto no se recorta: los espacios pueden formar parte de la contraseña
  const secreto = z
    .string()
    .max(
      LIMITES_CREDENCIAL.secreto,
      `El secreto admite hasta ${LIMITES_CREDENCIAL.secreto} caracteres.`,
    );

  return z.object({
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(
        LIMITES_CREDENCIAL.nombre,
        `El nombre admite hasta ${LIMITES_CREDENCIAL.nombre} caracteres.`,
      ),
    categoria: z.enum(VALORES_CATEGORIA, "Elige una categoría válida."),
    usuario: opcional(
      LIMITES_CREDENCIAL.usuario,
      `El usuario admite hasta ${LIMITES_CREDENCIAL.usuario} caracteres.`,
    ),
    secreto: secretoObligatorio
      ? secreto.min(1, "El secreto es obligatorio.")
      : secreto.transform((valor) => (valor === "" ? null : valor)),
    host: opcional(
      LIMITES_CREDENCIAL.host,
      `El host admite hasta ${LIMITES_CREDENCIAL.host} caracteres.`,
    ),
    nota: opcional(
      LIMITES_CREDENCIAL.nota,
      `La nota admite hasta ${LIMITES_CREDENCIAL.nota} caracteres.`,
    ),
    global: z.boolean(),
    proyectoIds: z
      .array(z.string().min(1))
      .max(LIMITES_CREDENCIAL.proyectos, "Demasiados proyectos seleccionados."),
  });
}

// Los valores que no son texto se tratan como vacíos para que el servidor nunca confíe en el cliente
function comoTexto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function comoLista(valor: unknown): string[] {
  const lista = Array.isArray(valor) ? valor : [];
  return [
    ...new Set(lista.filter((item): item is string => typeof item === "string" && item !== "")),
  ];
}

export type ResultadoValidacion =
  { ok: true; datos: DatosCredencial } | { ok: false; errores: ErroresCredencial };

export function validarCredencial(
  entrada: EntradaCredencial,
  opciones: { secretoObligatorio: boolean },
): ResultadoValidacion {
  const resultado = esquema(opciones.secretoObligatorio).safeParse({
    nombre: comoTexto(entrada.nombre),
    categoria: comoTexto(entrada.categoria),
    usuario: comoTexto(entrada.usuario),
    secreto: comoTexto(entrada.secreto),
    host: comoTexto(entrada.host),
    nota: comoTexto(entrada.nota),
    global: entrada.global === true,
    proyectoIds: comoLista(entrada.proyectoIds),
  });

  if (!resultado.success) {
    const errores: ErroresCredencial = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CamposCredencial;
      errores[campo] ??= problema.message;
    }
    return { ok: false, errores };
  }

  const datos = resultado.data;
  return {
    ok: true,
    datos: { ...datos, proyectoIds: datos.global ? [] : datos.proyectoIds },
  };
}
