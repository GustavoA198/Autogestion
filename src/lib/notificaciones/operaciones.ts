// Acceso a BD para notificaciones; crea con deduplicación.
import { obtenerPrisma } from "@/lib/prisma";
import { listarReunionesLocales } from "@/lib/calendario/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import type { NotificacionPorGenerar } from "./generador";
import { generarNotificaciones } from "./generador";

// Crea una notificación en BD, ignora si ya existe la clave única
async function upsertNotificacion(datos: NotificacionPorGenerar): Promise<void> {
  const prisma = obtenerPrisma();
  try {
    await prisma.notificacion.create({
      data: {
        tipo: datos.tipo,
        referenciaId: datos.referenciaId,
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        fechaEvento: datos.fechaEvento,
      },
    });
  } catch (error) {
    // Deduplicación por clave única: se ignora si ya existe
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return;
    }
    throw error;
  }
}

// Obtiene notificaciones no descartadas
export function listarNotificaciones() {
  return obtenerPrisma().notificacion.findMany({
    where: { descartada: null },
    orderBy: { fechaEvento: "asc" },
  });
}

// Obtiene el conteo de notificaciones no descartadas
export function contarNotificaciones() {
  return obtenerPrisma().notificacion.count({
    where: { descartada: null },
  });
}

// Descarta una notificación
export function descartarNotificacion(id: string): Promise<boolean> {
  return obtenerPrisma().$transaction(async (tx) => {
    const existente = await tx.notificacion.findUnique({ where: { id } });
    if (!existente) return false;

    await tx.notificacionDescartada.upsert({
      where: { notificacionId: id },
      create: { notificacionId: id },
      update: {},
    });
    return true;
  });
}

// Descarta todas las notificaciones
export function descartarTodasNotificaciones(): Promise<number> {
  return obtenerPrisma().$transaction(async (tx) => {
    const activas = await tx.notificacion.findMany({
      where: { descartada: null },
      select: { id: true },
    });
    await Promise.all(
      activas.map((n) =>
        tx.notificacionDescartada.upsert({
          where: { notificacionId: n.id },
          create: { notificacionId: n.id },
          update: {},
        }),
      ),
    );
    return activas.length;
  });
}

// Genera y persiste notificaciones para el momento actual
export async function generarYGuardarNotificaciones(): Promise<number> {
  const { TZ } = leerEntornoTiempo();
  const ahora = new Date();

  // Reuniones próximas (ventana 15 min)
  const reunionesRaw = await listarReunionesLocales(
    new Date(ahora.getTime() - 60 * 1000),
    new Date(ahora.getTime() + 16 * 60 * 1000),
  );
  // Mapear campos de Reunion Prisma a EventoCalendario (descripcion null → undefined)
  const reuniones = reunionesRaw.map((r) => ({
    idExterno: r.idExterno,
    titulo: r.titulo,
    descripcion: r.descripcion ?? undefined,
    inicio: r.inicio,
    fin: r.fin,
    enlaceReunion: r.enlaceReunion ?? undefined,
  }));

  // Tareas activas de hoy (todas, luego se filtran en el generador)
  const prisma = obtenerPrisma();
  const tareasRaw = await prisma.tarea.findMany({
    where: { activa: true },
    include: {
      completadas: { where: { fecha: { gte: new Date(ahora.toISOString().slice(0, 10)) } } },
    },
  });

  const tareas = tareasRaw.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    tipoFrecuencia: t.tipoFrecuencia as "DIARIA" | "SEMANAL" | "MENSUAL" | "PUNTUAL",
    diaSemana: t.diaSemana,
    diaMes: t.diaMes,
    fechaPuntual: t.fechaPuntual,
    completada: t.completadas.length > 0,
  }));

  const porGenerar = generarNotificaciones(reuniones, tareas, ahora, TZ);

  await Promise.all(porGenerar.map(upsertNotificacion));
  return porGenerar.length;
}
