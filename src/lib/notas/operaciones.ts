import type { DatosNota } from "@/lib/notas/validacion";
import { obtenerPrisma } from "@/lib/prisma";

export function listarNotasDeProyecto(proyectoId: string) {
  return obtenerPrisma().nota.findMany({
    where: { proyectoId },
    orderBy: { fecha: "desc" },
  });
}

export function obtenerNota(id: string) {
  return obtenerPrisma().nota.findUnique({ where: { id } });
}

export function buscarNotasEnProyecto(proyectoId: string, texto: string) {
  return obtenerPrisma().nota.findMany({
    where: {
      proyectoId,
      texto: { contains: texto, mode: "insensitive" },
    },
    orderBy: { fecha: "desc" },
  });
}

export async function crearNota(datos: DatosNota) {
  const nota = await obtenerPrisma().nota.create({
    data: {
      proyectoId: datos.proyectoId,
      fecha: datos.fecha,
      texto: datos.texto,
    },
    select: { id: true },
  });
  return { ok: true as const, id: nota.id };
}

export async function actualizarNota(id: string, datos: Omit<DatosNota, "proyectoId">) {
  const actual = await obtenerPrisma().nota.findUnique({ where: { id } });
  if (!actual) return null;

  await obtenerPrisma().nota.update({
    where: { id },
    data: { fecha: datos.fecha, texto: datos.texto },
  });
  return { ok: true as const, id };
}

export async function eliminarNota(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().nota.deleteMany({ where: { id } });
  return count > 0;
}
