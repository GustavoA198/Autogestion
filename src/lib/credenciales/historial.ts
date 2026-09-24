import type { DatosCredencial } from "@/lib/credenciales/validacion";

export type CampoHistorial =
  "nombre" | "categoría" | "usuario" | "secreto" | "host o URL" | "nota" | "alcance";

export type EstadoCredencial = Pick<
  DatosCredencial,
  "nombre" | "categoria" | "usuario" | "host" | "nota" | "global" | "proyectoIds"
>;

function mismosProyectos(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

// Devuelve solo los NOMBRES de los campos que cambian; jamás sus valores
export function camposCambiados(
  actual: EstadoCredencial,
  nuevo: EstadoCredencial,
  secretoNuevo: boolean,
): CampoHistorial[] {
  const cambios: CampoHistorial[] = [];
  if (actual.nombre !== nuevo.nombre) cambios.push("nombre");
  if (actual.categoria !== nuevo.categoria) cambios.push("categoría");
  if (actual.usuario !== nuevo.usuario) cambios.push("usuario");
  if (secretoNuevo) cambios.push("secreto");
  if (actual.host !== nuevo.host) cambios.push("host o URL");
  if (actual.nota !== nuevo.nota) cambios.push("nota");
  if (actual.global !== nuevo.global || !mismosProyectos(actual.proyectoIds, nuevo.proyectoIds)) {
    cambios.push("alcance");
  }
  return cambios;
}
