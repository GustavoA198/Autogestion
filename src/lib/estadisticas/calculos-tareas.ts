// Cálculos puros del estado, avance y vencimiento de las tareas; sin acceso a la base de datos.
import { avanceDeTarea } from "@/lib/tareas/avance";
import { calcularSemaforo, vencimientoEfectivo } from "@/lib/tareas/semaforo";
import { estaAbierta } from "@/lib/tareas/validacion";

export type TareaEstadistica = {
  id: string;
  estado: string;
  proyectoId: string | null;
  // Solo la casilla de cada subtarea: el avance se deriva de ahí
  subtareas: { hecho: boolean }[];
  fechaLimite: Date | null;
  fechaPuntual: Date | null;
  actualizadoEn: Date;
};

// Orden de presentación de los estados, del inicio al cierre del trabajo
export const ORDEN_ESTADOS = [
  "NUEVA",
  "EN_DESARROLLO",
  "PAUSADA",
  "BLOQUEADA",
  "COMPLETADA",
  "CANCELADA",
] as const;

export type ConteoEstado = { estado: string; cantidad: number };

// Cantidad de tareas por estado, siempre con los seis estados aunque estén en cero
export function tareasPorEstado(tareas: Pick<TareaEstadistica, "estado">[]): ConteoEstado[] {
  const mapa = new Map<string, number>(ORDEN_ESTADOS.map((estado) => [estado, 0]));
  for (const tarea of tareas) mapa.set(tarea.estado, (mapa.get(tarea.estado) ?? 0) + 1);
  return Array.from(mapa, ([estado, cantidad]) => ({ estado, cantidad }));
}

export type AvanceProyectoEstadistica = {
  proyectoId: string | null;
  nombre: string;
  // Promedio de las tareas abiertas con subtareas; null si el proyecto no tiene ninguna
  promedio: number | null;
  // Tareas abiertas con subtareas que entran en el promedio
  tareas: number;
};

// Promedio del avance de las tareas abiertas CON subtareas por proyecto; los proyectos sin ninguna van al final con null
export function avancePromedioPorProyecto(
  tareas: Pick<TareaEstadistica, "estado" | "proyectoId" | "subtareas">[],
  proyectos: { id: string; nombre: string }[],
  nombreSinProyecto = "Sin proyecto",
): AvanceProyectoEstadistica[] {
  const acumulado = new Map<string | null, { suma: number; tareas: number }>();
  for (const tarea of tareas) {
    if (!estaAbierta(tarea.estado)) continue;
    const previo = acumulado.get(tarea.proyectoId) ?? { suma: 0, tareas: 0 };
    const { porcentaje } = avanceDeTarea(tarea);
    acumulado.set(
      tarea.proyectoId,
      porcentaje === null ? previo : { suma: previo.suma + porcentaje, tareas: previo.tareas + 1 },
    );
  }
  const nombres = new Map(proyectos.map((p) => [p.id, p.nombre]));
  return Array.from(acumulado, ([proyectoId, { suma, tareas: cantidad }]) => ({
    proyectoId,
    nombre: proyectoId === null ? nombreSinProyecto : (nombres.get(proyectoId) ?? "Proyecto"),
    promedio: cantidad === 0 ? null : Math.round(suma / cantidad),
    tareas: cantidad,
  })).sort(
    (a, b) =>
      Number(a.promedio === null) - Number(b.promedio === null) ||
      (b.promedio ?? 0) - (a.promedio ?? 0) ||
      b.tareas - a.tareas,
  );
}

export type VencimientosAbiertas = {
  vencidas: number;
  pronto: number;
  aTiempo: number;
  sinFecha: number;
};

// Días de margen para considerar que una tarea vence pronto
export const DIAS_VENCE_PRONTO = 5;

// Clasifica las tareas abiertas: vencidas, vencen en 5 días o menos, a tiempo y sin fecha
export function vencidasVsATiempo(
  tareas: Pick<TareaEstadistica, "estado" | "fechaLimite" | "fechaPuntual">[],
  hoy: Date,
  zona?: string,
): VencimientosAbiertas {
  const resultado: VencimientosAbiertas = { vencidas: 0, pronto: 0, aTiempo: 0, sinFecha: 0 };
  for (const tarea of tareas) {
    if (!estaAbierta(tarea.estado)) continue;
    const { diasRestantes } = calcularSemaforo({
      vencimiento: vencimientoEfectivo(tarea),
      estado: tarea.estado,
      hoy,
      zona,
    });
    if (diasRestantes === null) resultado.sinFecha += 1;
    else if (diasRestantes < 0) resultado.vencidas += 1;
    else if (diasRestantes <= DIAS_VENCE_PRONTO) resultado.pronto += 1;
    else resultado.aTiempo += 1;
  }
  return resultado;
}
