import { obtenerPrisma } from "@/lib/prisma";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { correspondeHoy } from "@/lib/tareas/recurrencia";
import type { DatosTarea } from "@/lib/tareas/validacion";

export type TareaUI = Awaited<ReturnType<typeof listarTareas>>[number];

export function listarTareas() {
  return obtenerPrisma().tarea.findMany({
    where: { activa: true },
    include: { proyecto: { select: { id: true, nombre: true } } },
    orderBy: { creadoEn: "desc" },
  });
}

export function obtenerTarea(id: string) {
  return obtenerPrisma().tarea.findUnique({
    where: { id },
    include: { proyecto: { select: { id: true, nombre: true } } },
  });
}

export function listarTareasDeProyecto(proyectoId: string) {
  return obtenerPrisma().tarea.findMany({
    where: { activa: true, proyectoId },
    include: { proyecto: { select: { id: true, nombre: true } } },
    orderBy: { creadoEn: "desc" },
  });
}

export function listarTareasCompletadas(tareaId: string) {
  return obtenerPrisma().tareaCompletada.findMany({
    where: { tareaId },
    orderBy: { fecha: "desc" },
  });
}

export function listarTareasDeHoy(proyectoId?: string) {
  return obtenerPrisma().tarea.findMany({
    where: { activa: true, ...(proyectoId ? { proyectoId } : {}) },
    include: { proyecto: { select: { id: true, nombre: true } } },
  });
}

export async function crearTarea(datos: DatosTarea) {
  return obtenerPrisma().tarea.create({
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      tipoFrecuencia: datos.tipoFrecuencia,
      diaSemana: datos.diaSemana,
      diaMes: datos.diaMes,
      fechaPuntual: datos.fechaPuntual,
      proyectoId: datos.proyectoId,
      activa: true,
    },
    select: { id: true },
  });
}

export async function actualizarTarea(id: string, datos: DatosTarea) {
  const actual = await obtenerPrisma().tarea.findUnique({ where: { id }, select: { id: true } });
  if (!actual) return null;

  return obtenerPrisma().tarea.update({
    where: { id },
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      tipoFrecuencia: datos.tipoFrecuencia,
      diaSemana: datos.diaSemana,
      diaMes: datos.diaMes,
      fechaPuntual: datos.fechaPuntual,
      proyectoId: datos.proyectoId,
      activa: datos.activa,
    },
    select: { id: true },
  });
}

export async function eliminarTarea(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().tarea.deleteMany({ where: { id } });
  return count > 0;
}

function fechaLocalDeHoy(zonaHoraria: string): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const fechaStr = fmt.format(new Date());
  const [anio, mes, dia] = fechaStr.split("-").map(Number) as [number, number, number];
  return new Date(anio, mes - 1, dia, 12, 0, 0);
}

export async function completarTarea(id: string): Promise<boolean> {
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();

  const tarea = await obtenerPrisma().tarea.findUnique({ where: { id } });
  if (!tarea) return false;

  if (
    !correspondeHoy(
      {
        tipoFrecuencia: tarea.tipoFrecuencia,
        diaSemana: tarea.diaSemana,
        diaMes: tarea.diaMes,
        fechaPuntual: tarea.fechaPuntual,
      },
      ahora,
      TZ,
    )
  ) {
    return false;
  }

  const fecha = fechaLocalDeHoy(TZ);

  try {
    await obtenerPrisma().tareaCompletada.create({
      data: { tareaId: id, fecha },
    });
  } catch (error) {
    // Si ya existe el registro para ese día, se ignora
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return true;
    }
    throw error;
  }
  return true;
}

export async function desconpletarTarea(id: string): Promise<boolean> {
  const { TZ } = leerEntornoTiempo();
  const fecha = fechaLocalDeHoy(TZ);

  const { count } = await obtenerPrisma().tareaCompletada.deleteMany({
    where: { tareaId: id, fecha },
  });
  return count > 0;
}

export async function estaCompletadaHoy(id: string): Promise<boolean> {
  const { TZ } = leerEntornoTiempo();
  const fecha = fechaLocalDeHoy(TZ);

  const count = await obtenerPrisma().tareaCompletada.count({
    where: { tareaId: id, fecha },
  });
  return count > 0;
}

export type ResultadoClonacion = {
  cantidad: number;
  ids: string[];
};

// Clona tareas recurrentes de un proyecto origen a uno destino
// - Lee las tareas de origen y verifica que existan y sean del proyecto origen
// - Crea nuevas Tarea con los mismos campos excepto id nuevo, proyectoId=destinoId, sin TareaCompletada
// - La tarea original queda intacta
export async function clonarTareas(
  origenId: string,
  destinoId: string,
  tareaIds: string[],
): Promise<ResultadoClonacion> {
  if (origenId === destinoId) {
    return { cantidad: 0, ids: [] };
  }

  const prisma = obtenerPrisma();

  return prisma.$transaction(async (tx) => {
    // Verifica que las tareas existan y pertenezcan al proyecto origen
    const tareas = await tx.tarea.findMany({
      where: {
        id: { in: tareaIds },
        proyectoId: origenId,
        activa: true,
      },
    });

    if (tareas.length !== tareaIds.length) {
      return { cantidad: 0, ids: [] };
    }

    // Crea las tareas clonadas sin historial de completadas
    const creadas = await Promise.all(
      tareas.map((tarea) =>
        tx.tarea.create({
          data: {
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            tipoFrecuencia: tarea.tipoFrecuencia,
            diaSemana: tarea.diaSemana,
            diaMes: tarea.diaMes,
            fechaPuntual: tarea.fechaPuntual,
            proyectoId: destinoId,
            activa: true,
          },
          select: { id: true },
        }),
      ),
    );

    return {
      cantidad: creadas.length,
      ids: creadas.map((c) => c.id),
    };
  });
}
