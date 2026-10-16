import { obtenerPrisma } from "@/lib/prisma";
import type { DatosProyecto, EnlaceProyecto } from "@/lib/proyectos/validacion";

export type ResultadoEscritura =
  { ok: true; id: string } | { ok: false; error: "nombre-duplicado" };

// Código de Prisma para violación de unicidad
const CODIGO_UNICIDAD = "P2002";
const CODIGO_NO_ENCONTRADO = "P2025";

function tieneCodigo(error: unknown, codigo: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === codigo;
}

// El orden de cada enlace es su posición en la lista enviada
function filasDeEnlaces(enlaces: EnlaceProyecto[]) {
  return enlaces.map((enlace, orden) => ({ ...enlace, orden }));
}

export function listarProyectos() {
  return obtenerPrisma().proyecto.findMany({
    orderBy: { nombre: "asc" },
    include: { enlaces: { orderBy: { orden: "asc" } } },
  });
}

export function obtenerProyecto(id: string) {
  return obtenerPrisma().proyecto.findUnique({
    where: { id },
    include: { enlaces: { orderBy: { orden: "asc" } } },
  });
}

export async function crearProyecto(
  datos: DatosProyecto,
  enlaces: EnlaceProyecto[] = [],
): Promise<ResultadoEscritura> {
  try {
    const proyecto = await obtenerPrisma().proyecto.create({
      data: { ...datos, enlaces: { create: filasDeEnlaces(enlaces) } },
    });
    return { ok: true, id: proyecto.id };
  } catch (error) {
    if (tieneCodigo(error, CODIGO_UNICIDAD)) return { ok: false, error: "nombre-duplicado" };
    throw error;
  }
}

// Devuelve null si el proyecto ya no existe
export async function actualizarProyecto(
  id: string,
  datos: DatosProyecto,
  enlaces: EnlaceProyecto[] = [],
): Promise<ResultadoEscritura | null> {
  try {
    // Reemplaza la lista completa de enlaces en una sola operación atómica
    await obtenerPrisma().proyecto.update({
      where: { id },
      data: { ...datos, enlaces: { deleteMany: {}, create: filasDeEnlaces(enlaces) } },
    });
    return { ok: true, id };
  } catch (error) {
    if (tieneCodigo(error, CODIGO_UNICIDAD)) return { ok: false, error: "nombre-duplicado" };
    if (tieneCodigo(error, CODIGO_NO_ENCONTRADO)) return null;
    throw error;
  }
}

// Borra las credenciales y contactos exclusivos del proyecto; lo demas solo se desvincula por cascada
export async function eliminarProyecto(id: string): Promise<boolean> {
  return obtenerPrisma().$transaction(async (tx) => {
    await tx.credencial.deleteMany({
      where: {
        global: false,
        proyectos: { some: { proyectoId: id } },
        NOT: { proyectos: { some: { proyectoId: { not: id } } } },
      },
    });
    await tx.contacto.deleteMany({
      where: {
        global: false,
        proyectos: { some: { proyectoId: id } },
        NOT: { proyectos: { some: { proyectoId: { not: id } } } },
      },
    });
    const { count } = await tx.proyecto.deleteMany({ where: { id } });
    return count > 0;
  });
}
