import type { Prisma } from "@/generated/prisma/client";
import type { EstadoTarea } from "@/generated/prisma/enums";
import { obtenerPrisma } from "@/lib/prisma";
import {
  descartarNotificacionesDeTarea,
  eliminarNotificacionesDeTarea,
  estadoSinAviso,
} from "@/lib/notificaciones/tareas";
import { avanceDeTarea } from "@/lib/tareas/avance";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { correspondeHoy } from "@/lib/tareas/recurrencia";
import { estaAbierta } from "@/lib/tareas/validacion";
import type { DatosEnlace, DatosTarea } from "@/lib/tareas/validacion";

export type TareaUI = Awaited<ReturnType<typeof listarTareas>>[number];

const INCLUIR_PROYECTO = { proyecto: { select: { id: true, nombre: true } } } as const;

// Listados: solo la casilla de cada subtarea (sin textos) para derivar el avance sin consultas extra
const INCLUIR_AVANCE = { subtareas: { select: { hecho: true } } } as const;
const INCLUIR_LISTADO = { ...INCLUIR_PROYECTO, ...INCLUIR_AVANCE } as const;

// Estados que sacan a la tarea de la lista de hoy (BLOQUEADA sí aparece)
const ESTADOS_FUERA_DE_HOY: EstadoTarea[] = ["PAUSADA", "COMPLETADA", "CANCELADA"];

export type FiltrosTareas = {
  estado?: EstadoTarea;
  proyectoId?: string;
  // Vencimiento efectivo (fechaLimite o, si falta, fechaPuntual) dentro de N días; incluye vencidas
  vencenEnDias?: number;
  // Por defecto solo salen las tareas abiertas (activa = true)
  incluirCerradas?: boolean;
};

export function listarTareas(filtros: FiltrosTareas = {}) {
  const where: Prisma.TareaWhereInput = {};
  if (!filtros.incluirCerradas) where.activa = true;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.proyectoId) where.proyectoId = filtros.proyectoId;
  if (filtros.vencenEnDias !== undefined) {
    const { TZ } = leerEntornoTiempo();
    const hoy = fechaLocalDeHoy(TZ);
    const tope = new Date(
      Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + filtros.vencenEnDias, 23, 59, 59),
    );
    where.OR = [{ fechaLimite: { lte: tope } }, { fechaLimite: null, fechaPuntual: { lte: tope } }];
  }

  return obtenerPrisma().tarea.findMany({
    where,
    include: INCLUIR_LISTADO,
    orderBy: { creadoEn: "desc" },
  });
}

// Filtro de pendientes: puntuales abiertas sin día ni fecha límite (misma regla que esPendiente)
const DONDE_PENDIENTE: Prisma.TareaWhereInput = {
  activa: true,
  tipoFrecuencia: "PUNTUAL",
  estado: { notIn: ["COMPLETADA", "CANCELADA"] },
  fechaPuntual: null,
  fechaLimite: null,
};

// Pendientes sin fecha, de la más reciente a la más antigua; el límite recorta la lista, no el conteo
export async function listarPendientes(limite?: number) {
  const prisma = obtenerPrisma();
  const [tareas, total] = await Promise.all([
    prisma.tarea.findMany({
      where: DONDE_PENDIENTE,
      include: INCLUIR_LISTADO,
      orderBy: { creadoEn: "desc" },
      take: limite,
    }),
    prisma.tarea.count({ where: DONDE_PENDIENTE }),
  ]);
  return { tareas, total };
}

export function contarPendientes(): Promise<number> {
  return obtenerPrisma().tarea.count({ where: DONDE_PENDIENTE });
}

// Programa un pendiente: guarda solo el día (fechaPuntual), que ya define el vencimiento efectivo y "hoy"
export async function asignarFechaPendiente(id: string, fecha: Date): Promise<boolean> {
  const { count } = await obtenerPrisma().tarea.updateMany({
    where: { ...DONDE_PENDIENTE, id },
    data: { fechaPuntual: fecha },
  });
  return count > 0;
}

export function obtenerTarea(id: string) {
  return obtenerPrisma().tarea.findUnique({
    where: { id },
    include: {
      ...INCLUIR_PROYECTO,
      enlaces: { orderBy: { orden: "asc" } },
      subtareas: { orderBy: [{ orden: "asc" }, { id: "asc" }] },
      comentarios: { orderBy: { creadoEn: "desc" } },
    },
  });
}

export function listarTareasDeProyecto(proyectoId: string) {
  return obtenerPrisma().tarea.findMany({
    where: { activa: true, proyectoId },
    include: INCLUIR_LISTADO,
    orderBy: { creadoEn: "desc" },
  });
}

export function listarTareasCompletadas(tareaId: string, limite?: number) {
  return obtenerPrisma().tareaCompletada.findMany({
    where: { tareaId },
    orderBy: { fecha: "desc" },
    take: limite,
  });
}

export function listarTareasDeHoy(proyectoId?: string) {
  return obtenerPrisma().tarea.findMany({
    where: {
      activa: true,
      estado: { notIn: ESTADOS_FUERA_DE_HOY },
      ...(proyectoId ? { proyectoId } : {}),
    },
    include: INCLUIR_LISTADO,
  });
}

// Campos escalares de la tarea; los undefined no se escriben (al actualizar quedan intactos)
function camposDeTarea(datos: DatosTarea) {
  return {
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    tipoFrecuencia: datos.tipoFrecuencia,
    diaSemana: datos.diaSemana,
    diaMes: datos.diaMes,
    fechaPuntual: datos.fechaPuntual,
    proyectoId: datos.proyectoId,
    estado: datos.estado,
    prioridad: datos.prioridad,
    fechaInicio: datos.fechaInicio,
    fechaLimite: datos.fechaLimite,
    responsable: datos.responsable,
    asignadoPor: datos.asignadoPor,
    activa: datos.activa,
  };
}

export async function crearTarea(datos: DatosTarea) {
  // Una tarea creada ya completada deja la marca de hoy, igual que al completarla después
  const marca =
    datos.estado === "COMPLETADA"
      ? { completadas: { create: { fecha: fechaLocalDeHoy(leerEntornoTiempo().TZ) } } }
      : {};
  return obtenerPrisma().tarea.create({
    data: { ...camposDeTarea(datos), activa: datos.activa ?? true, ...marca },
    select: { id: true },
  });
}

export async function actualizarTarea(id: string, datos: DatosTarea) {
  return obtenerPrisma().$transaction(async (tx) => {
    const actual = await tx.tarea.findUnique({ where: { id }, select: { id: true, estado: true } });
    if (!actual) return null;

    const actualizada = await tx.tarea.update({
      where: { id },
      data: camposDeTarea(datos),
      select: { id: true },
    });
    if (datos.estado && datos.estado !== actual.estado) {
      await sincronizarEstado(tx, {
        tareaId: id,
        tipoFrecuencia: datos.tipoFrecuencia,
        anterior: actual.estado,
        nuevo: datos.estado,
      });
    }
    return actualizada;
  });
}

// Borra la tarea y sus notificaciones (la referencia no tiene FK)
export async function eliminarTarea(id: string): Promise<boolean> {
  return obtenerPrisma().$transaction(async (tx) => {
    await eliminarNotificacionesDeTarea(tx, id);
    const { count } = await tx.tarea.deleteMany({ where: { id } });
    return count > 0;
  });
}

// Efectos de un cambio de estado: marca del día, subtareas al completar y notificaciones pendientes
async function sincronizarEstado(
  tx: Transaccion,
  cambio: { tareaId: string; tipoFrecuencia: string; anterior: EstadoTarea; nuevo: EstadoTarea },
): Promise<void> {
  const { tareaId, tipoFrecuencia, anterior, nuevo } = cambio;
  if (nuevo === anterior) return;
  if (estadoSinAviso(nuevo)) await descartarNotificacionesDeTarea(tx, tareaId);

  const fecha = fechaLocalDeHoy(leerEntornoTiempo().TZ);
  if (nuevo === "COMPLETADA") {
    await marcarCompletadaHoy(tx, tareaId, fecha);
    await tx.tareaChecklistItem.updateMany({ where: { tareaId }, data: { hecho: true } });
    return;
  }

  // Al reabrir se quita la marca: en puntuales todas (es una sola vez), en recurrentes solo la de hoy
  const puntual = tipoFrecuencia === "PUNTUAL";
  if (anterior === "COMPLETADA" || (puntual && estaAbierta(nuevo))) {
    await tx.tareaCompletada.deleteMany({ where: puntual ? { tareaId } : { tareaId, fecha } });
  }
}

// Crea la marca del día sin fallar si ya existe (un error abortaría la transacción)
function marcarCompletadaHoy(
  cliente: Pick<Transaccion, "tareaCompletada">,
  tareaId: string,
  fecha: Date,
) {
  return cliente.tareaCompletada.upsert({
    where: { tareaId_fecha: { tareaId, fecha } },
    create: { tareaId, fecha },
    update: {},
  });
}

// Cambia el estado: COMPLETADA marca hoy y todas las subtareas como hechas; activa sigue al estado
export async function cambiarEstadoTarea(id: string, estado: EstadoTarea) {
  return obtenerPrisma().$transaction(async (tx) => {
    const actual = await tx.tarea.findUnique({
      where: { id },
      select: { estado: true, tipoFrecuencia: true },
    });
    if (!actual) return null;

    const actualizada = await tx.tarea.update({
      where: { id },
      data: { estado, activa: estaAbierta(estado) },
      select: { id: true, estado: true, activa: true },
    });
    await sincronizarEstado(tx, {
      tareaId: id,
      tipoFrecuencia: actual.tipoFrecuencia,
      anterior: actual.estado,
      nuevo: estado,
    });
    return actualizada;
  });
}

// Resultado de un cambio de subtareas sobre una tarea completada o cancelada
export const TAREA_CERRADA = "TAREA_CERRADA" as const;

export async function agregarEnlace(tareaId: string, datos: DatosEnlace) {
  const prisma = obtenerPrisma();
  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId }, select: { id: true } });
  if (!tarea) return null;

  const { _max } = await prisma.tareaEnlace.aggregate({
    where: { tareaId },
    _max: { orden: true },
  });
  return prisma.tareaEnlace.create({
    data: { tareaId, etiqueta: datos.etiqueta, url: datos.url, orden: (_max.orden ?? -1) + 1 },
    select: { id: true },
  });
}

export async function eliminarEnlace(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().tareaEnlace.deleteMany({ where: { id } });
  return count > 0;
}

type Transaccion = Prisma.TransactionClient;

// Una tarea cerrada no admite subtareas nuevas, salvo las iniciales al crearla
export async function agregarSubtarea(
  tareaId: string,
  texto: string,
  opciones: { permitirCerrada?: boolean; hecha?: boolean; descripcion?: string | null } = {},
) {
  return obtenerPrisma().$transaction(async (tx) => {
    const tarea = await tx.tarea.findUnique({ where: { id: tareaId }, select: { estado: true } });
    if (!tarea) return null;
    if (!opciones.permitirCerrada && !estaAbierta(tarea.estado)) return TAREA_CERRADA;

    const { _max } = await tx.tareaChecklistItem.aggregate({
      where: { tareaId },
      _max: { orden: true },
    });
    return tx.tareaChecklistItem.create({
      data: {
        tareaId,
        texto,
        descripcion: opciones.descripcion ?? null,
        hecho: opciones.hecha ?? false,
        orden: (_max.orden ?? -1) + 1,
      },
      select: { id: true },
    });
  });
}

// Subtarea con el estado de su tarea; una tarea cerrada rechaza cualquier cambio
async function subtareaEditable(tx: Transaccion, id: string) {
  const subtarea = await tx.tareaChecklistItem.findUnique({
    where: { id },
    select: { id: true, tareaId: true, hecho: true, tarea: { select: { estado: true } } },
  });
  if (!subtarea) return null;
  return estaAbierta(subtarea.tarea.estado) ? subtarea : TAREA_CERRADA;
}

// Cambia el texto y la descripción de la subtarea; ambos llegan ya validados
export async function editarSubtarea(id: string, texto: string, descripcion?: string | null) {
  return obtenerPrisma().$transaction(async (tx) => {
    const subtarea = await subtareaEditable(tx, id);
    if (subtarea === null || subtarea === TAREA_CERRADA) return subtarea;
    return tx.tareaChecklistItem.update({
      where: { id },
      data: { texto, descripcion: descripcion ?? null },
      select: { id: true },
    });
  });
}

// Invierte la casilla de la subtarea y devuelve el nuevo valor de "hecho"
export async function alternarSubtarea(id: string) {
  return obtenerPrisma().$transaction(async (tx) => {
    const subtarea = await subtareaEditable(tx, id);
    if (subtarea === null || subtarea === TAREA_CERRADA) return subtarea;
    const hecho = !subtarea.hecho;
    await tx.tareaChecklistItem.update({ where: { id }, data: { hecho } });
    return { hecho };
  });
}

// Devuelve false si la subtarea no existía
export async function eliminarSubtarea(id: string) {
  return obtenerPrisma().$transaction(async (tx) => {
    const subtarea = await subtareaEditable(tx, id);
    if (subtarea === null) return false;
    if (subtarea === TAREA_CERRADA) return TAREA_CERRADA;
    await tx.tareaChecklistItem.delete({ where: { id } });
    return true;
  });
}

// Intercambia la subtarea con su vecina y renumera "orden" de forma estable (los empates se rompen por id)
export async function moverSubtarea(id: string, sentido: "arriba" | "abajo") {
  return obtenerPrisma().$transaction(async (tx) => {
    const subtarea = await subtareaEditable(tx, id);
    if (subtarea === null || subtarea === TAREA_CERRADA) return subtarea;

    const hermanas = await tx.tareaChecklistItem.findMany({
      where: { tareaId: subtarea.tareaId },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      select: { id: true, orden: true },
    });
    const indice = hermanas.findIndex((h) => h.id === id);
    const destino = sentido === "arriba" ? indice - 1 : indice + 1;
    if (indice < 0 || destino < 0 || destino >= hermanas.length) return { movida: false };

    const nuevoOrden = hermanas.map((h) => h.id);
    [nuevoOrden[indice], nuevoOrden[destino]] = [nuevoOrden[destino]!, nuevoOrden[indice]!];
    for (const [posicion, hermanaId] of nuevoOrden.entries()) {
      const previa = hermanas.find((h) => h.id === hermanaId);
      if (previa?.orden === posicion) continue;
      await tx.tareaChecklistItem.update({ where: { id: hermanaId }, data: { orden: posicion } });
    }
    return { movida: true };
  });
}

export async function agregarComentario(tareaId: string, texto: string) {
  const prisma = obtenerPrisma();
  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId }, select: { id: true } });
  if (!tarea) return null;

  return prisma.tareaComentario.create({ data: { tareaId, texto }, select: { id: true } });
}

export async function eliminarComentario(id: string): Promise<boolean> {
  const { count } = await obtenerPrisma().tareaComentario.deleteMany({ where: { id } });
  return count > 0;
}

// Fecha local de hoy en la zona (a mediodía) para claves de día sin corrimiento por UTC
export function fechaLocalDeHoy(zonaHoraria: string): Date {
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
  if (!estaAbierta(tarea.estado)) return false;

  // Las puntuales y las que tienen rango se pueden completar aunque hoy no sea su día exacto
  const sinExigirHoy =
    tarea.tipoFrecuencia === "PUNTUAL" || tarea.fechaInicio !== null || tarea.fechaLimite !== null;
  if (
    !sinExigirHoy &&
    !correspondeHoy(
      {
        tipoFrecuencia: tarea.tipoFrecuencia,
        diaSemana: tarea.diaSemana,
        diaMes: tarea.diaMes,
        fechaPuntual: tarea.fechaPuntual,
        estado: tarea.estado,
        fechaInicio: tarea.fechaInicio,
        fechaLimite: tarea.fechaLimite,
      },
      ahora,
      TZ,
    )
  ) {
    return false;
  }

  await marcarCompletadaHoy(obtenerPrisma(), id, fechaLocalDeHoy(TZ));
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

// Ids de las tareas dadas que tienen registro de completada en el día local de hoy
export async function idsCompletadasHoy(tareaIds: string[]): Promise<Set<string>> {
  if (tareaIds.length === 0) return new Set();
  const { TZ } = leerEntornoTiempo();
  const registros = await obtenerPrisma().tareaCompletada.findMany({
    where: { tareaId: { in: tareaIds }, fecha: fechaLocalDeHoy(TZ) },
    select: { tareaId: true },
  });
  return new Set(registros.map((r) => r.tareaId));
}

// Completa desde listas: las puntuales se cierran (cambiarEstadoTarea deja la marca) y las recurrentes solo marcan el día
export async function completarTareaConEstado(id: string): Promise<boolean> {
  const tarea = await obtenerPrisma().tarea.findUnique({
    where: { id },
    select: { tipoFrecuencia: true, estado: true },
  });
  if (!tarea) return false;
  if (tarea.tipoFrecuencia !== "PUNTUAL") return completarTarea(id);
  if (!estaAbierta(tarea.estado)) return false;
  return (await cambiarEstadoTarea(id, "COMPLETADA")) !== null;
}

// Deshace desde listas: quita la marca de hoy y, en las puntuales, reabre según tenga subtareas hechas
export async function reabrirTarea(id: string): Promise<boolean> {
  const tarea = await obtenerPrisma().tarea.findUnique({
    where: { id },
    select: { tipoFrecuencia: true, estado: true, subtareas: { select: { hecho: true } } },
  });
  if (!tarea) return false;
  if (tarea.tipoFrecuencia !== "PUNTUAL") return desconpletarTarea(id);

  if (tarea.estado === "COMPLETADA") {
    // cambiarEstadoTarea quita las marcas al reabrir
    const conAvance =
      avanceDeTarea({ estado: tarea.estado, subtareas: tarea.subtareas }).hechas > 0;
    await cambiarEstadoTarea(id, conAvance ? "EN_DESARROLLO" : "NUEVA");
  } else {
    await obtenerPrisma().tareaCompletada.deleteMany({ where: { tareaId: id } });
  }
  return true;
}

export type ResultadoClonacion = {
  cantidad: number;
  ids: string[];
};

// Clona tareas recurrentes al proyecto destino: estado NUEVA, subtareas sin hacer, sin fechas, comentarios ni historial
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
        tipoFrecuencia: { not: "PUNTUAL" },
      },
      include: {
        enlaces: { orderBy: { orden: "asc" } },
        subtareas: { orderBy: { orden: "asc" } },
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
            prioridad: tarea.prioridad,
            responsable: tarea.responsable,
            asignadoPor: tarea.asignadoPor,
            estado: "NUEVA",
            proyectoId: destinoId,
            activa: true,
            enlaces: {
              create: tarea.enlaces.map((e) => ({
                etiqueta: e.etiqueta,
                url: e.url,
                orden: e.orden,
              })),
            },
            subtareas: {
              create: tarea.subtareas.map((c) => ({
                texto: c.texto,
                descripcion: c.descripcion,
                hecho: false,
                orden: c.orden,
              })),
            },
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
