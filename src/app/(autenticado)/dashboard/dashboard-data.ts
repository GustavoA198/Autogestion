// Carga de datos para cada bloque del dashboard.
// Cada funcion es independiente para que Promise.allSettled las ejecute en paralelo
// y un fallo en una no afecte a las demas.

import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import { correspondeHoy } from "@/lib/tareas/recurrencia";
import { listarTareas, type TareaUI } from "@/lib/tareas/operaciones";
import { listarReunionesLocales } from "@/lib/calendario/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { agruparPorSemana, agruparPorProyecto } from "@/lib/estadisticas/calculos";
import { contarNotificaciones } from "@/lib/notificaciones/operaciones";
import type { EventoCalendario } from "@/lib/calendario/proveedor";
import type { TareaCompletadaConTarea } from "@/lib/estadisticas/calculos";

export type ResultadoReuniones =
  { ok: true; reuniones: EventoCalendario[] } | { ok: false; error: string };

export async function cargarReunionesHoy(): Promise<ResultadoReuniones> {
  try {
    const ahora = new Date();
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
    const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    const reuniones = await listarReunionesLocales(inicioDia, finDia);
    const mapeadas: EventoCalendario[] = reuniones.map((r) => ({
      idExterno: r.idExterno,
      titulo: r.titulo,
      descripcion: r.descripcion ?? undefined,
      inicio: r.inicio,
      fin: r.fin,
      enlaceReunion: r.enlaceReunion ?? undefined,
    }));
    return { ok: true, reuniones: mapeadas };
  } catch {
    return { ok: false, error: "No se pudieron cargar las reuniones." };
  }
}

export type TareaDelDia = TareaUI & { esRecurrente: boolean };

export type ResultadoTareas =
  { ok: true; recurrentes: TareaDelDia[]; puntuales: TareaDelDia[] } | { ok: false; error: string };

export async function cargarTareasDelDia(): Promise<ResultadoTareas> {
  try {
    const { TZ } = leerEntornoTiempo();
    const hoy = new Date();
    const tareas = await listarTareas();
    const delDia = tareas.filter((t) =>
      correspondeHoy(
        {
          tipoFrecuencia: t.tipoFrecuencia,
          diaSemana: t.diaSemana,
          diaMes: t.diaMes,
          fechaPuntual: t.fechaPuntual,
        },
        hoy,
        TZ,
      ),
    );
    const mapper = (t: TareaUI): TareaDelDia => ({
      ...t,
      esRecurrente: t.tipoFrecuencia !== "PUNTUAL",
    });
    const recurrentes = delDia.filter((t) => t.tipoFrecuencia !== "PUNTUAL").map(mapper);
    const puntuales = delDia.filter((t) => t.tipoFrecuencia === "PUNTUAL").map(mapper);
    return { ok: true, recurrentes, puntuales };
  } catch {
    return { ok: false, error: "No se pudieron cargar las tareas del dia." };
  }
}

const MAX_PROYECTOS_ACCESOS = 6;

export type ResultadoProyectos =
  { ok: true; proyectos: { id: string; nombre: string }[] } | { ok: false; error: string };

export async function cargarProyectosAccesos(): Promise<ResultadoProyectos> {
  try {
    const proyectos = await listarProyectos();
    return {
      ok: true,
      proyectos: proyectos
        .slice(0, MAX_PROYECTOS_ACCESOS)
        .map((p) => ({ id: p.id, nombre: p.nombre })),
    };
  } catch {
    return { ok: false, error: "No se pudieron cargar los proyectos." };
  }
}

export type DatoSemana = { semana: string; cantidad: number };
export type DatoProyecto = { proyectoId: string | null; nombre: string; cantidad: number };

export type ResultadoEstadisticas =
  | { ok: true; datosSemana: DatoSemana[]; datosProyecto: DatoProyecto[]; total: number }
  | { ok: false; error: string };

export async function cargarEstadisticas(): Promise<ResultadoEstadisticas> {
  try {
    const { TZ } = leerEntornoTiempo();
    const { obtenerPrisma } = await import("@/lib/prisma");
    const ahora = new Date();
    const hace4Semanas = new Date(ahora);
    hace4Semanas.setDate(hace4Semanas.getDate() - 28);
    const [completadas, proyectos] = await Promise.all([
      obtenerPrisma().tareaCompletada.findMany({
        where: { fecha: { gte: hace4Semanas } },
        include: { tarea: { select: { proyectoId: true } } },
        orderBy: { fecha: "asc" },
      }),
      obtenerPrisma().proyecto.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: "asc" },
      }),
    ]);
    const datosSemana = agruparPorSemana(completadas as TareaCompletadaConTarea[], TZ);
    const datosProyecto = agruparPorProyecto(completadas as TareaCompletadaConTarea[], proyectos);
    return { ok: true, datosSemana, datosProyecto, total: completadas.length };
  } catch {
    return { ok: false, error: "No se pudieron cargar las estadisticas." };
  }
}

export type ResultadoNotificaciones = { ok: true; cantidad: number } | { ok: false; cantidad: 0 };

export async function cargarNotificaciones(): Promise<ResultadoNotificaciones> {
  try {
    const cantidad = await contarNotificaciones();
    return { ok: true, cantidad };
  } catch {
    return { ok: false, cantidad: 0 };
  }
}
