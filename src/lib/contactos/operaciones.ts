import type { Prisma } from "@/generated/prisma/client";
import type { DatosContacto } from "@/lib/contactos/validacion";
import { obtenerPrisma } from "@/lib/prisma";

export type ResultadoEscritura =
  { ok: true; id: string } | { ok: false; error: "proyecto-inexistente" };

export type FiltroContactos = {
  texto?: string;
  alcance?: string;
};

export type ResumenEliminacionProyecto = {
  exclusivas: string[];
  desvinculadas: string[];
};

const CODIGO_LLAVE_FORANEA = "P2003";
const CODIGO_NO_ENCONTRADO = "P2025";

function tieneCodigo(error: unknown, codigo: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === codigo;
}

function filtroAlcance(alcance: string | undefined): Prisma.ContactoWhereInput {
  if (!alcance) return {};
  if (alcance === "global") return { global: true };
  return { proyectos: { some: { proyectoId: alcance } } };
}

const CON_PROYECTOS = {
  proyectos: { select: { proyecto: { select: { id: true, nombre: true } } } },
} satisfies Prisma.ContactoInclude;

export function listarContactos(filtro: FiltroContactos = {}) {
  const where: Prisma.ContactoWhereInput = {
    ...filtroAlcance(filtro.alcance),
    ...(filtro.texto
      ? {
          OR: [
            { nombre: { contains: filtro.texto, mode: "insensitive" } },
            { correo: { contains: filtro.texto, mode: "insensitive" } },
            { empresaOCargo: { contains: filtro.texto, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  return obtenerPrisma().contacto.findMany({
    where,
    include: CON_PROYECTOS,
    orderBy: { nombre: "asc" },
  });
}

export function obtenerContacto(id: string) {
  return obtenerPrisma().contacto.findUnique({
    where: { id },
    include: { ...CON_PROYECTOS },
  });
}

export function listarContactosDeProyecto(proyectoId: string) {
  return obtenerPrisma().contacto.findMany({
    where: { OR: [{ global: true }, { proyectos: { some: { proyectoId } } }] },
    orderBy: { nombre: "asc" },
  });
}

export function listarContactosVinculables(proyectoId: string) {
  return obtenerPrisma().contacto.findMany({
    where: { global: false, proyectos: { none: { proyectoId } } },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearContacto(datos: DatosContacto): Promise<ResultadoEscritura> {
  try {
    const contacto = await obtenerPrisma().contacto.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono,
        empresaOCargo: datos.empresaOCargo,
        nota: datos.nota,
        global: datos.global,
        proyectos: { create: datos.proyectoIds.map((proyectoId) => ({ proyectoId })) },
      },
      select: { id: true },
    });
    return { ok: true, id: contacto.id };
  } catch (error) {
    if (tieneCodigo(error, CODIGO_LLAVE_FORANEA)) {
      return { ok: false, error: "proyecto-inexistente" };
    }
    throw error;
  }
}

export async function actualizarContacto(
  id: string,
  datos: DatosContacto,
): Promise<ResultadoEscritura | null> {
  try {
    const actual = await obtenerPrisma().contacto.findUnique({
      where: { id },
      select: {
        nombre: true,
        correo: true,
        telefono: true,
        empresaOCargo: true,
        nota: true,
        global: true,
        proyectos: { select: { proyectoId: true } },
      },
    });
    if (!actual) return null;

    const cambios = [
      actual.nombre !== datos.nombre,
      actual.correo !== datos.correo,
      actual.telefono !== datos.telefono,
      actual.empresaOCargo !== datos.empresaOCargo,
      actual.nota !== datos.nota,
      actual.global !== datos.global,
      JSON.stringify(actual.proyectos.map((v) => v.proyectoId).sort()) !==
        JSON.stringify([...datos.proyectoIds].sort()),
    ];
    if (!cambios.some(Boolean)) return { ok: true, id };

    await obtenerPrisma().$transaction(async (tx) => {
      await tx.contacto.update({
        where: { id },
        data: {
          nombre: datos.nombre,
          correo: datos.correo,
          telefono: datos.telefono,
          empresaOCargo: datos.empresaOCargo,
          nota: datos.nota,
          global: datos.global,
          ...(cambios[6]
            ? {
                proyectos: {
                  deleteMany: {},
                  create: datos.proyectoIds.map((proyectoId) => ({ proyectoId })),
                },
              }
            : {}),
        },
      });
    });
    return { ok: true, id };
  } catch (error) {
    if (tieneCodigo(error, CODIGO_LLAVE_FORANEA)) {
      return { ok: false, error: "proyecto-inexistente" };
    }
    if (tieneCodigo(error, CODIGO_NO_ENCONTRADO)) return null;
    throw error;
  }
}

export async function eliminarContacto(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().contacto.deleteMany({ where: { id } });
  return count > 0;
}

export async function vincularContacto(contactoId: string, proyectoId: string): Promise<void> {
  await obtenerPrisma().contactoProyecto.createMany({
    data: [{ contactoId, proyectoId }],
    skipDuplicates: true,
  });
}

export async function desvincularContacto(contactoId: string, proyectoId: string): Promise<void> {
  await obtenerPrisma().contactoProyecto.deleteMany({ where: { contactoId, proyectoId } });
}

export function esExclusiva(
  contacto: { global: boolean; proyectos: { proyectoId: string }[] },
  proyectoId: string,
): boolean {
  return !contacto.global && contacto.proyectos.every((v) => v.proyectoId === proyectoId);
}

export async function resumirEliminacionProyecto(
  proyectoId: string,
): Promise<ResumenEliminacionProyecto> {
  const vinculadas = await obtenerPrisma().contacto.findMany({
    where: { proyectos: { some: { proyectoId } } },
    select: { nombre: true, global: true, proyectos: { select: { proyectoId: true } } },
    orderBy: { nombre: "asc" },
  });
  const resumen: ResumenEliminacionProyecto = { exclusivas: [], desvinculadas: [] };
  for (const contacto of vinculadas) {
    const destino = esExclusiva(contacto, proyectoId) ? "exclusivas" : "desvinculadas";
    resumen[destino].push(contacto.nombre);
  }
  return resumen;
}
