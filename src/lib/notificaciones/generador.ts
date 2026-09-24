// Lógica pura: calcula qué notificaciones corresponde generar para una fecha y zona.
// No accede a BD ni tiene efectos secundarios.
import type { EventoCalendario } from "@/lib/calendario/proveedor";
import type { TareaRecurrente } from "@/lib/tareas/recurrencia";
import { correspondeHoy } from "@/lib/tareas/recurrencia";

export const VENTANA_MINUTOS = 15;

export type NotificacionPorGenerar = {
  tipo: "REUNION_PROXIMA" | "TAREA_VENCE_HOY";
  referenciaId: string;
  titulo: string;
  mensaje: string;
  fechaEvento: Date;
};

/**
 * Reuniones que inician en la ventana [ahora, ahora + VENTANA_MINUTOS].
 */
function reunionesEnVentana(reuniones: EventoCalendario[], ahora: Date): EventoCalendario[] {
  const inicioVentana = new Date(ahora);
  const finVentana = new Date(ahora.getTime() + VENTANA_MINUTOS * 60 * 1000);

  return reuniones.filter((r) => {
    const inicioUtc = new Date(r.inicio);
    return inicioUtc >= inicioVentana && inicioUtc <= finVentana;
  });
}

/**
 * Tareas que corresponden a hoy y no están completadas.
 */
function tareasVencidasHoy<
  T extends TareaRecurrente & { id: string; titulo: string; completada: boolean },
>(tareas: T[], ahora: Date, zonaHoraria: string): T[] {
  return tareas.filter((t) => !t.completada && correspondeHoy(t, ahora, zonaHoraria));
}

/**
 * Genera notificaciones a partir de reuniones y tareas.
 * - Reuniones en ventana de 15 min → REUNION_PROXIMA
 * - Tareas de hoy sin completar → TAREA_VENCE_HOY
 */
export function generarNotificaciones(
  reuniones: EventoCalendario[],
  tareas: Array<TareaRecurrente & { id: string; titulo: string; completada: boolean }>,
  ahora: Date,
  zonaHoraria: string,
): NotificacionPorGenerar[] {
  const resultado: NotificacionPorGenerar[] = [];

  for (const reunion of reunionesEnVentana(reuniones, ahora)) {
    resultado.push({
      tipo: "REUNION_PROXIMA",
      referenciaId: reunion.idExterno,
      titulo: "Reunión próxima",
      mensaje: `La reunión "${reunion.titulo}" comienza en ${VENTANA_MINUTOS} minutos.`,
      fechaEvento: new Date(reunion.inicio),
    });
  }

  for (const tarea of tareasVencidasHoy(tareas, ahora, zonaHoraria)) {
    resultado.push({
      tipo: "TAREA_VENCE_HOY",
      referenciaId: tarea.id,
      titulo: "Tarea pendiente",
      mensaje: `La tarea "${tarea.titulo}" aún no está completada hoy.`,
      fechaEvento: ahora,
    });
  }

  return resultado;
}
