import type { Prisma } from "@/generated/prisma/client";
import { cifrar, descifrar } from "@/lib/cifrado/cifrado";
import type { Categoria } from "@/lib/credenciales/categorias";
import { camposCambiados } from "@/lib/credenciales/historial";
import type { DatosCredencial } from "@/lib/credenciales/validacion";
import { obtenerPrisma } from "@/lib/prisma";

export type ResultadoEscritura =
  { ok: true; id: string } | { ok: false; error: "proyecto-inexistente" };

export type FiltroCredenciales = {
  categoria?: Categoria;
  // "global" o el id de un proyecto
  alcance?: string;
};

export type ResumenEliminacionProyecto = {
  exclusivas: string[];
  desvinculadas: string[];
};

const CODIGO_NO_ENCONTRADO = "P2025";
const CODIGO_LLAVE_FORANEA = "P2003";

// El secreto cifrado nunca sale de esta capa salvo descifrado por obtenerSecreto
const SIN_SECRETO = { secretoCifrado: true } as const;
const CON_PROYECTOS = {
  proyectos: { select: { proyecto: { select: { id: true, nombre: true } } } },
} satisfies Prisma.CredencialInclude;

function tieneCodigo(error: unknown, codigo: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === codigo;
}

function filtroAlcance(alcance: string | undefined): Prisma.CredencialWhereInput {
  if (!alcance) return {};
  if (alcance === "global") return { global: true };
  return { proyectos: { some: { proyectoId: alcance } } };
}

export function listarCredenciales(filtro: FiltroCredenciales = {}) {
  return obtenerPrisma().credencial.findMany({
    where: {
      ...(filtro.categoria ? { categoria: filtro.categoria } : {}),
      ...filtroAlcance(filtro.alcance),
    },
    omit: SIN_SECRETO,
    include: CON_PROYECTOS,
    orderBy: { nombre: "asc" },
  });
}

export function obtenerCredencial(id: string) {
  return obtenerPrisma().credencial.findUnique({
    where: { id },
    omit: SIN_SECRETO,
    include: { ...CON_PROYECTOS, historial: { orderBy: { fecha: "desc" } } },
  });
}

// Las propias del proyecto y las globales, sin secretos
export function listarCredencialesDeProyecto(proyectoId: string) {
  return obtenerPrisma().credencial.findMany({
    where: { OR: [{ global: true }, { proyectos: { some: { proyectoId } } }] },
    omit: SIN_SECRETO,
    orderBy: { nombre: "asc" },
  });
}

// Credenciales no globales que aún no están vinculadas al proyecto
export function listarCredencialesVinculables(proyectoId: string) {
  return obtenerPrisma().credencial.findMany({
    where: { global: false, proyectos: { none: { proyectoId } } },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearCredencial(datos: DatosCredencial): Promise<ResultadoEscritura> {
  try {
    const credencial = await obtenerPrisma().credencial.create({
      data: {
        nombre: datos.nombre,
        categoria: datos.categoria,
        usuario: datos.usuario,
        host: datos.host,
        nota: datos.nota,
        global: datos.global,
        secretoCifrado: cifrar(datos.secreto ?? ""),
        proyectos: { create: datos.proyectoIds.map((proyectoId) => ({ proyectoId })) },
      },
      select: { id: true },
    });
    return { ok: true, id: credencial.id };
  } catch (error) {
    if (tieneCodigo(error, CODIGO_LLAVE_FORANEA)) {
      return { ok: false, error: "proyecto-inexistente" };
    }
    throw error;
  }
}

// Devuelve null si la credencial ya no existe; con secreto null conserva el actual
export async function actualizarCredencial(
  id: string,
  datos: DatosCredencial,
): Promise<ResultadoEscritura | null> {
  try {
    return await obtenerPrisma().$transaction(async (tx) => {
      const actual = await tx.credencial.findUnique({
        where: { id },
        select: {
          nombre: true,
          categoria: true,
          usuario: true,
          host: true,
          nota: true,
          global: true,
          proyectos: { select: { proyectoId: true } },
        },
      });
      if (!actual) return null;

      const cambios = camposCambiados(
        { ...actual, proyectoIds: actual.proyectos.map((vinculo) => vinculo.proyectoId) },
        datos,
        datos.secreto !== null,
      );
      if (cambios.length === 0) return { ok: true as const, id };

      await tx.credencial.update({
        where: { id },
        data: {
          nombre: datos.nombre,
          categoria: datos.categoria,
          usuario: datos.usuario,
          host: datos.host,
          nota: datos.nota,
          global: datos.global,
          ...(datos.secreto !== null
            ? { secretoCifrado: cifrar(datos.secreto), secretoActualizadoEn: new Date() }
            : {}),
          ...(cambios.includes("alcance")
            ? {
                proyectos: {
                  deleteMany: {},
                  create: datos.proyectoIds.map((proyectoId) => ({ proyectoId })),
                },
              }
            : {}),
        },
      });
      // Solo el nombre del campo: el historial nunca guarda valores
      await tx.historialCredencial.createMany({
        data: cambios.map((campo) => ({ credencialId: id, campo })),
      });
      return { ok: true as const, id };
    });
  } catch (error) {
    if (tieneCodigo(error, CODIGO_LLAVE_FORANEA)) {
      return { ok: false, error: "proyecto-inexistente" };
    }
    if (tieneCodigo(error, CODIGO_NO_ENCONTRADO)) return null;
    throw error;
  }
}

export async function eliminarCredencial(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().credencial.deleteMany({ where: { id } });
  return count > 0;
}

// Único punto que devuelve el secreto en claro; devuelve null si la credencial no existe
export async function obtenerSecreto(id: string): Promise<string | null> {
  const credencial = await obtenerPrisma().credencial.findUnique({
    where: { id },
    select: { secretoCifrado: true },
  });
  return credencial ? descifrar(credencial.secretoCifrado) : null;
}

export async function vincularCredencial(credencialId: string, proyectoId: string): Promise<void> {
  await obtenerPrisma().credencialProyecto.createMany({
    data: [{ credencialId, proyectoId }],
    skipDuplicates: true,
  });
}

// Quita solo el vínculo: la credencial y el proyecto permanecen
export async function desvincularCredencial(
  credencialId: string,
  proyectoId: string,
): Promise<void> {
  await obtenerPrisma().credencialProyecto.deleteMany({ where: { credencialId, proyectoId } });
}

// Exclusiva: no global y vinculada únicamente a este proyecto
export function esExclusiva(
  credencial: { global: boolean; proyectos: { proyectoId: string }[] },
  proyectoId: string,
): boolean {
  return !credencial.global && credencial.proyectos.every((v) => v.proyectoId === proyectoId);
}

// Nombres de lo que se borraría y de lo que solo se desvincularía al eliminar el proyecto
export async function resumirEliminacionProyecto(
  proyectoId: string,
): Promise<ResumenEliminacionProyecto> {
  const vinculadas = await obtenerPrisma().credencial.findMany({
    where: { proyectos: { some: { proyectoId } } },
    select: { nombre: true, global: true, proyectos: { select: { proyectoId: true } } },
    orderBy: { nombre: "asc" },
  });
  const resumen: ResumenEliminacionProyecto = { exclusivas: [], desvinculadas: [] };
  for (const credencial of vinculadas) {
    const destino = esExclusiva(credencial, proyectoId) ? "exclusivas" : "desvinculadas";
    resumen[destino].push(credencial.nombre);
  }
  return resumen;
}
