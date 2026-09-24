import { z } from "zod";

export const LIMITES_CONTACTO = {
  nombre: 80,
  correo: 320,
  telefono: 30,
  empresa: 120,
  nota: 500,
  proyectos: 200,
} as const;

export type CamposContacto =
  "nombre" | "correo" | "telefono" | "empresaOCargo" | "nota" | "proyectoIds";
export type ErroresContacto = Partial<Record<CamposContacto, string>>;

export type DatosContacto = {
  nombre: string;
  correo: string;
  telefono: string | null;
  empresaOCargo: string | null;
  nota: string | null;
  global: boolean;
  proyectoIds: string[];
};

export type EntradaContacto = Record<Exclude<CamposContacto, "proyectoIds">, unknown> & {
  global: unknown;
  proyectoIds: unknown;
};

const opcional = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .transform((valor) => (valor === "" ? null : valor));

function esquema() {
  return z.object({
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .max(
        LIMITES_CONTACTO.nombre,
        `El nombre admite hasta ${LIMITES_CONTACTO.nombre} caracteres.`,
      ),
    correo: z
      .string()
      .trim()
      .min(1, "El correo es obligatorio.")
      .email("El correo debe tener formato válido.")
      .max(
        LIMITES_CONTACTO.correo,
        `El correo admite hasta ${LIMITES_CONTACTO.correo} caracteres.`,
      ),
    telefono: opcional(
      LIMITES_CONTACTO.telefono,
      `El teléfono admite hasta ${LIMITES_CONTACTO.telefono} caracteres.`,
    ).refine(
      (val) => val === null || /^[+\d\s\-().]+$/.test(val),
      "El teléfono solo puede contener dígitos, espacios, guiones, paréntesis o el símbolo +.",
    ),
    empresaOCargo: opcional(
      LIMITES_CONTACTO.empresa,
      `La empresa o cargo admite hasta ${LIMITES_CONTACTO.empresa} caracteres.`,
    ),
    nota: opcional(
      LIMITES_CONTACTO.nota,
      `La nota admite hasta ${LIMITES_CONTACTO.nota} caracteres.`,
    ),
    global: z.boolean(),
    proyectoIds: z
      .array(z.string().min(1))
      .max(LIMITES_CONTACTO.proyectos, "Demasiados proyectos seleccionados."),
  });
}

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
  { ok: true; datos: DatosContacto } | { ok: false; errores: ErroresContacto };

export function validarContacto(entrada: EntradaContacto): ResultadoValidacion {
  const resultado = esquema().safeParse({
    nombre: comoTexto(entrada.nombre),
    correo: comoTexto(entrada.correo),
    telefono: comoTexto(entrada.telefono),
    empresaOCargo: comoTexto(entrada.empresaOCargo),
    nota: comoTexto(entrada.nota),
    global: entrada.global === true,
    proyectoIds: comoLista(entrada.proyectoIds),
  });

  if (!resultado.success) {
    const errores: ErroresContacto = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CamposContacto;
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
