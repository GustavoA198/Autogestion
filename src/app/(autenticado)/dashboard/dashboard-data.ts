// Carga de datos de cada bloque del dashboard; son independientes para que un fallo no afecte a los demás.

import { avanceDeTarea } from "@/lib/tareas/avance";
import { leerEntornoTiempo } from "@/lib/tareas/tiempo";
import {
  idsCompletadasHoy,
  listarPendientes,
  listarTareas,
  type TareaUI,
} from "@/lib/tareas/operaciones";
import { vencimientoEfectivo, type ResultadoSemaforo } from "@/lib/tareas/semaforo";
import { estaAbierta } from "@/lib/tareas/validacion";
import { esDeHoy, semaforoDeTarea } from "@/lib/tareas/vista";
import { listarReunionesLocales, type ReunionDetalle } from "@/lib/calendario/operaciones";
import { listarProyectos } from "@/lib/proyectos/operaciones";
import { cargarDatosCumplimiento } from "@/lib/estadisticas/consultas";
import { semanasDelPeriodo } from "@/lib/estadisticas/semanas";
import {
  contarNotificaciones,
  contarNotificacionesPriorizadas,
} from "@/lib/notificaciones/operaciones";
import { DIAS_SIN_AVANCE } from "@/lib/notas/constantes";
import { obtenerUltimaNotaGlobal, proyectosSinAvance } from "@/lib/notas/operaciones";
import { diasEntre, hoyComoFecha } from "@/lib/notas/periodo";

export type ResultadoReuniones =
  { ok: true; reuniones: ReunionDetalle[] } | { ok: false; error: string };

// Ventana amplia en UTC: el navegador decide qué es "hoy" con su zona horaria
const DIA_MS = 24 * 60 * 60 * 1000;

export async function cargarReunionesHoy(): Promise<ResultadoReuniones> {
  try {
    const ahora = Date.now();
    const desde = new Date(ahora - 2 * DIA_MS);
    const hasta = new Date(ahora + 10 * DIA_MS);
    const reuniones = await listarReunionesLocales(desde, hasta);
    return { ok: true, reuniones };
  } catch {
    return { ok: false, error: "No se pudieron cargar las reuniones." };
  }
}

export type TareaDelDia = TareaUI & {
  esRecurrente: boolean;
  completadaHoy: boolean;
  semaforo: ResultadoSemaforo;
};

export type ResultadoTareas =
  { ok: true; recurrentes: TareaDelDia[]; puntuales: TareaDelDia[] } | { ok: false; error: string };

export async function cargarTareasDelDia(): Promise<ResultadoTareas> {
  try {
    const { TZ } = leerEntornoTiempo();
    const hoy = new Date();
    // Incluye cerradas: una puntual completada hoy sigue visible para poder deshacerla
    const tareas = await listarTareas({ incluirCerradas: true });
    const completadasHoy = await idsCompletadasHoy(tareas.map((t) => t.id));
    const delDia = tareas.filter((t) => esDeHoy(t, completadasHoy, hoy, TZ));
    const mapper = (t: TareaUI): TareaDelDia => ({
      ...t,
      esRecurrente: t.tipoFrecuencia !== "PUNTUAL",
      completadaHoy: completadasHoy.has(t.id),
      semaforo: semaforoDeTarea(t),
    });
    const recurrentes = delDia.filter((t) => t.tipoFrecuencia !== "PUNTUAL").map(mapper);
    const puntuales = delDia.filter((t) => t.tipoFrecuencia === "PUNTUAL").map(mapper);
    return { ok: true, recurrentes, puntuales };
  } catch {
    return { ok: false, error: "No se pudieron cargar las tareas del dia." };
  }
}

// Ventana del bloque "Vencen pronto" y umbral del indicador del panel
const DIAS_VENCEN_PRONTO = 10;
const DIAS_INDICADOR_PRONTO = 5;
const MAX_VENCEN_PRONTO = 6;

export type TareaVencePronto = {
  id: string;
  titulo: string;
  estado: string;
  // Subtareas hechas y totales (total 0: sin subtareas)
  avance: { hechas: number; total: number };
  proyecto: { id: string; nombre: string } | null;
  vencimiento: Date;
  semaforo: ResultadoSemaforo;
  // Datos completos para pintar la tarjeta compacta
  tarea: TareaUI;
};

export type ResultadoVencenPronto =
  | {
      ok: true;
      tareas: TareaVencePronto[];
      total: number;
      // Vencidas (antes de hoy) y las que vencen en 5 días o menos, hoy incluido
      vencidas: number;
      proximas: number;
    }
  | { ok: false; error: string };

export async function cargarTareasVencenPronto(): Promise<ResultadoVencenPronto> {
  try {
    const tareas = await listarTareas({ vencenEnDias: DIAS_VENCEN_PRONTO });
    const filas = tareas
      .filter((t) => estaAbierta(t.estado))
      .flatMap((t) => {
        const vencimiento = vencimientoEfectivo(t);
        if (!vencimiento) return [];
        const avance = avanceDeTarea(t);
        const fila: TareaVencePronto = {
          id: t.id,
          titulo: t.titulo,
          estado: t.estado,
          avance: { hechas: avance.hechas, total: avance.total },
          proyecto: t.proyecto,
          vencimiento,
          semaforo: semaforoDeTarea(t),
          tarea: t,
        };
        return [fila];
      })
      .sort((a, b) => a.vencimiento.getTime() - b.vencimiento.getTime());
    const dias = (f: TareaVencePronto) => f.semaforo.diasRestantes ?? Number.POSITIVE_INFINITY;
    return {
      ok: true,
      tareas: filas.slice(0, MAX_VENCEN_PRONTO),
      total: filas.length,
      vencidas: filas.filter((f) => dias(f) < 0).length,
      proximas: filas.filter((f) => dias(f) <= DIAS_INDICADOR_PRONTO).length,
    };
  } catch {
    return { ok: false, error: "No se pudieron cargar las tareas que vencen pronto." };
  }
}

const MAX_PENDIENTES = 5;

export type TareaPendiente = TareaUI;

export type ResultadoPendientes =
  { ok: true; tareas: TareaPendiente[]; total: number } | { ok: false; error: string };

// Pendientes sin fecha (fuera del calendario): las más recientes y el total
export async function cargarPendientes(): Promise<ResultadoPendientes> {
  try {
    const { tareas, total } = await listarPendientes(MAX_PENDIENTES);
    return {
      ok: true,
      tareas,
      total,
    };
  } catch {
    return { ok: false, error: "No se pudieron cargar los pendientes." };
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

// Semanas ISO completas que resume el panel; las mismas cifras que /estadisticas
const SEMANAS_PANEL = 4;

export async function cargarEstadisticas(): Promise<ResultadoEstadisticas> {
  try {
    const { TZ } = leerEntornoTiempo();
    const semanas = semanasDelPeriodo(new Date(), SEMANAS_PANEL, TZ);
    const [cumplimiento, proyectos] = await Promise.all([
      cargarDatosCumplimiento(semanas, TZ),
      listarProyectos(),
    ]);
    const porProyecto = new Map<string | null, number>();
    for (const e of cumplimiento.eventos) {
      porProyecto.set(e.proyectoId, (porProyecto.get(e.proyectoId) ?? 0) + 1);
    }
    return {
      ok: true,
      datosSemana: cumplimiento.completadas.map((d) => ({ semana: d.semana, cantidad: d.valor })),
      datosProyecto: proyectos
        .map((p) => ({ proyectoId: p.id, nombre: p.nombre, cantidad: porProyecto.get(p.id) ?? 0 }))
        .sort((a, b) => b.cantidad - a.cantidad),
      total: cumplimiento.total,
    };
  } catch {
    return { ok: false, error: "No se pudieron cargar las estadisticas." };
  }
}

export type ResultadoNotificaciones =
  { ok: true; cantidad: number; urgentes: number } | { ok: false; cantidad: 0; urgentes: 0 };

export async function cargarNotificaciones(): Promise<ResultadoNotificaciones> {
  try {
    const cantidad = await contarNotificaciones();
    // Las urgentes son un detalle: si su cálculo falla, el total se muestra igual
    let urgentes = 0;
    try {
      urgentes = (await contarNotificacionesPriorizadas()).urgentes;
    } catch {
      urgentes = 0;
    }
    return { ok: true, cantidad, urgentes };
  } catch {
    return { ok: false, cantidad: 0, urgentes: 0 };
  }
}

export type UltimaBitacora = {
  proyecto: { id: string; nombre: string };
  notaId: string;
  proximoPaso: string;
  dias: number;
};

export type ResultadoUltimaBitacora =
  { ok: true; ultima: UltimaBitacora | null } | { ok: false; error: string };

// Última entrada de toda la bitácora, para retomar el trabajo con un clic
export async function cargarUltimaBitacora(): Promise<ResultadoUltimaBitacora> {
  try {
    const { TZ } = leerEntornoTiempo();
    const nota = await obtenerUltimaNotaGlobal();
    if (!nota) return { ok: true, ultima: null };
    const dias = Math.max(0, diasEntre(nota.fecha, hoyComoFecha(TZ)));
    return {
      ok: true,
      ultima: {
        proyecto: nota.proyecto,
        notaId: nota.id,
        proximoPaso: nota.proximoPaso,
        dias,
      },
    };
  } catch {
    return { ok: false, error: "No se pudo cargar la última entrada de la bitácora." };
  }
}

export type ProyectoSinAvance = { id: string; nombre: string; dias: number; sinNotas: boolean };

export type ResultadoSinAvance =
  { ok: true; proyectos: ProyectoSinAvance[] } | { ok: false; error: string };

// Proyectos sin entradas en más de DIAS_SIN_AVANCE días, del más rezagado al menos
export async function cargarProyectosSinAvance(): Promise<ResultadoSinAvance> {
  try {
    const rezagados = await proyectosSinAvance(DIAS_SIN_AVANCE);
    return {
      ok: true,
      proyectos: rezagados.map((a) => ({
        id: a.proyecto.id,
        nombre: a.proyecto.nombre,
        dias: a.dias,
        sinNotas: a.sinNotas,
      })),
    };
  } catch {
    return { ok: false, error: "No se pudieron revisar los proyectos sin avance." };
  }
}
