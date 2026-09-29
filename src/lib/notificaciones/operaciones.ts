// Acceso a BD para notificaciones; crea con deduplicación.
import { obtenerPrisma } from "@/lib/prisma";
import { listarReunionesEnRango } from "@/lib/calendario/operaciones";
import { diaCivilDe, inicioDelDia, sumarDias } from "@/lib/calendario/fechas";
import { fechaLocalDeHoy } from "@/lib/tareas/operaciones";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { TIPOS_NOTIFICACION_TAREA } from "./tareas";
import type { NotificacionPorGenerar } from "./generador";
import {
  MINUTOS_TRAS_INICIO,
  clasificarNotificacion,
  compararPrioridad,
  contarUrgentes,
  type NotificacionPriorizada,
  type TareaParaClasificar,
  type TipoNotificacionBase,
} from "./prioridad";
import {
  contarTareasQueVencen,
  generarAvisosPronto,
  generarAvisosReunionesPronto,
  generarNotificaciones,
  generarResumenDia,
} from "./generador";

// Crea la notificación; si ya existe (clave única) refresca título y mensaje sin resucitar una descartada
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
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      // Solo se toca si el contenido cambió y la notificación sigue activa
      await prisma.notificacion.updateMany({
        where: {
          tipo: datos.tipo,
          referenciaId: datos.referenciaId,
          fechaEvento: datos.fechaEvento,
          descartada: null,
          OR: [{ mensaje: { not: datos.mensaje } }, { titulo: { not: datos.titulo } }],
        },
        data: { titulo: datos.titulo, mensaje: datos.mensaje },
      });
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

// Cantidad de notificaciones vigentes (las mismas que muestra la lista, sin las que ya no aplican)
export async function contarNotificaciones(): Promise<number> {
  return (await listarNotificacionesPriorizadas()).length;
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

  // Reuniones: ventana de 15 min (urgentes) + 5 días (próximamente). Traemos todo el rango de golpe.
  const finRangoReuniones = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);
  const reunionesRaw = (
    await listarReunionesEnRango(ahora, finRangoReuniones)
  ).filter((r) => !r.diaCompleto && r.estado !== "cancelled");
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
      // Completadas desde el día local de la zona, no desde el día UTC
      completadas: { where: { fecha: { gte: fechaLocalDeHoy(TZ) } } },
    },
  });

  const tareas = tareasRaw.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    tipoFrecuencia: t.tipoFrecuencia as "DIARIA" | "SEMANAL" | "MENSUAL" | "PUNTUAL",
    diaSemana: t.diaSemana,
    diaMes: t.diaMes,
    fechaPuntual: t.fechaPuntual,
    estado: t.estado,
    fechaInicio: t.fechaInicio,
    fechaLimite: t.fechaLimite,
    completada: t.completadas.length > 0,
  }));

  // Reuniones con hora del día local (sin canceladas ni de día completo) para el resumen
  const inicioDia = inicioDelDia(diaCivilDe(ahora, TZ), TZ);
  const finDia = inicioDelDia(sumarDias(diaCivilDe(ahora, TZ), 1), TZ);
  const reunionesDelDia = (await listarReunionesEnRango(inicioDia, finDia)).filter(
    (r) => !r.diaCompleto && r.estado !== "cancelled",
  );

  const porGenerar = [
    ...generarNotificaciones(reuniones, tareas, ahora, TZ),
    ...generarAvisosReunionesPronto(reuniones, ahora, TZ),
    ...generarAvisosPronto(tareas, ahora, TZ),
  ];
  const resumen = generarResumenDia(
    reunionesDelDia.length,
    contarTareasQueVencen(tareas, ahora, TZ),
    ahora,
    TZ,
  );
  if (resumen) porGenerar.push(resumen);

  await Promise.all(porGenerar.map(upsertNotificacion));
  await descartarObsoletasDeTareas(porGenerar);
  await descartarObsoletasDeReuniones(ahora);
  return porGenerar.length;
}

function claveNotificacion(n: { tipo: string; referenciaId: string; fechaEvento: Date }): string {
  return `${n.tipo}|${n.referenciaId}|${n.fechaEvento.getTime()}`;
}

// Descarta avisos de tareas y resúmenes que ya no aplican hoy (cerradas, borradas, sin fecha o de días anteriores)
async function descartarObsoletasDeTareas(vigentes: NotificacionPorGenerar[]): Promise<void> {
  const prisma = obtenerPrisma();
  const claves = new Set(vigentes.map(claveNotificacion));
  const pendientes = await prisma.notificacion.findMany({
    // El resumen de días anteriores o sin datos también queda obsoleto
    where: { tipo: { in: [...TIPOS_NOTIFICACION_TAREA, "RESUMEN_DIA"] }, descartada: null },
    select: { id: true, tipo: true, referenciaId: true, fechaEvento: true },
  });
  const obsoletas = pendientes.filter((n) => !claves.has(claveNotificacion(n)));
  if (obsoletas.length === 0) return;
  await prisma.notificacionDescartada.createMany({
    data: obsoletas.map((n) => ({ notificacionId: n.id })),
    skipDuplicates: true,
  });
}

// Descarta avisos de reunión cuya reunión ya empezó hace más de la ventana, se movió, se canceló o desapareció
async function descartarObsoletasDeReuniones(ahora: Date): Promise<void> {
  const prisma = obtenerPrisma();
  const pendientes = await prisma.notificacion.findMany({
    where: { tipo: "REUNION_PROXIMA", descartada: null },
    select: { id: true, referenciaId: true, fechaEvento: true },
  });
  if (pendientes.length === 0) return;

  const reuniones = await prisma.reunion.findMany({
    where: { idExterno: { in: pendientes.map((n) => n.referenciaId) } },
    select: { idExterno: true, inicio: true, estado: true },
  });
  const limite = ahora.getTime() - MINUTOS_TRAS_INICIO * 60_000;
  const obsoletas = pendientes.filter((n) => {
    if (n.fechaEvento.getTime() < limite) return true;
    return !reuniones.some(
      (r) =>
        r.idExterno === n.referenciaId &&
        r.inicio.getTime() === n.fechaEvento.getTime() &&
        r.estado !== "cancelled",
    );
  });
  if (obsoletas.length === 0) return;
  await prisma.notificacionDescartada.createMany({
    data: obsoletas.map((n) => ({ notificacionId: n.id })),
    skipDuplicates: true,
  });
}

type FilaPriorizada = { visible: NotificacionPriorizada; orden: number; creado: Date };

// Notificaciones activas clasificadas por severidad y ordenadas; las que ya no aplican se omiten
export async function listarNotificacionesPriorizadas(
  ahora: Date = new Date(),
): Promise<NotificacionPriorizada[]> {
  const prisma = obtenerPrisma();
  const { TZ } = leerEntornoTiempo();
  const activas = await prisma.notificacion.findMany({ where: { descartada: null } });
  if (activas.length === 0) return [];

  const idsTarea = activas
    .filter((n) => TIPOS_NOTIFICACION_TAREA.some((t) => t === n.tipo))
    .map((n) => n.referenciaId);
  const idsReunion = activas.filter((n) => n.tipo === "REUNION_PROXIMA").map((n) => n.referenciaId);

  // Un solo lote por entidad para evitar consultas por notificación
  const [tareas, reuniones] = await Promise.all([
    idsTarea.length === 0
      ? []
      : prisma.tarea.findMany({
          where: { id: { in: idsTarea }, activa: true },
          select: {
            id: true,
            titulo: true,
            estado: true,
            tipoFrecuencia: true,
            fechaLimite: true,
            fechaPuntual: true,
            completadas: {
              where: { fecha: { gte: fechaLocalDeHoy(TZ) } },
              select: { tareaId: true },
            },
          },
        }),
    idsReunion.length === 0
      ? []
      : prisma.reunion.findMany({
          where: { idExterno: { in: idsReunion } },
          select: { idExterno: true, titulo: true, inicio: true, estado: true },
        }),
  ]);
  const tareaPorId = new Map(tareas.map((t) => [t.id, t]));

  const filas: FilaPriorizada[] = [];
  for (const n of activas) {
    const tipo = n.tipo as TipoNotificacionBase;
    let asunto = n.titulo;
    let tarea: TareaParaClasificar | null = null;

    if (tipo === "REUNION_PROXIMA") {
      const reunion = reuniones.find(
        (r) => r.idExterno === n.referenciaId && r.inicio.getTime() === n.fechaEvento.getTime(),
      );
      if (!reunion || reunion.estado === "cancelled") continue;
      asunto = reunion.titulo;
    } else if (tipo !== "RESUMEN_DIA") {
      const t = tareaPorId.get(n.referenciaId);
      if (t) {
        asunto = t.titulo;
        tarea = {
          estado: t.estado,
          tipoFrecuencia: t.tipoFrecuencia,
          fechaLimite: t.fechaLimite,
          fechaPuntual: t.fechaPuntual,
          completadaHoy: t.completadas.length > 0,
        };
      }
    }

    const clase = clasificarNotificacion(
      { tipo, referenciaId: n.referenciaId, fechaEvento: n.fechaEvento, creadoEn: n.creadoEn },
      tarea,
      ahora,
      TZ,
    );
    if (!clase) continue;
    filas.push({
      orden: clase.orden,
      creado: n.creadoEn,
      visible: {
        id: n.id,
        tipo,
        referenciaId: n.referenciaId,
        asunto,
        mensaje: n.mensaje,
        fechaEvento: n.fechaEvento.toISOString(),
        creadoEn: n.creadoEn.toISOString(),
        severidad: clase.severidad,
        grupo: clase.grupo,
        etiqueta: clase.etiqueta,
        insignia: clase.insignia,
        detalle: clase.detalle,
        enlace: clase.enlace,
      },
    });
  }

  filas.sort((a, b) =>
    compararPrioridad(
      { severidad: a.visible.severidad, orden: a.orden, creadoEn: a.creado },
      { severidad: b.visible.severidad, orden: b.orden, creadoEn: b.creado },
    ),
  );
  return filas.map((f) => f.visible);
}

// Totales de la campana y el panel: pendientes y urgentes según la clasificación vigente
export async function contarNotificacionesPriorizadas(): Promise<{
  total: number;
  urgentes: number;
}> {
  const lista = await listarNotificacionesPriorizadas();
  return { total: lista.length, urgentes: contarUrgentes(lista) };
}
