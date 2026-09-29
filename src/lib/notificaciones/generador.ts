// Lógica pura, sin BD ni efectos: calcula qué notificaciones generar para una fecha y zona.
import type { EventoCalendario } from "@/lib/calendario/proveedor";
import type { TareaRecurrente } from "@/lib/tareas/recurrencia";
import { correspondeHoy } from "@/lib/tareas/recurrencia";
import { calcularSemaforo, vencimientoEfectivo } from "@/lib/tareas/semaforo";
import { estadoSinAviso } from "./tareas";

export const VENTANA_MINUTOS = 15;
// Hasta cuántos días antes se avisa que una tarea vence pronto
export const DIAS_AVISO_PRONTO = 5;

export type TipoNotificacionGenerada =
  "REUNION_PROXIMA" | "TAREA_VENCE_HOY" | "TAREA_VENCE_PRONTO" | "RESUMEN_DIA";

export type NotificacionPorGenerar = {
  tipo: TipoNotificacionGenerada;
  referenciaId: string;
  titulo: string;
  mensaje: string;
  fechaEvento: Date;
};

type TareaNotificable = TareaRecurrente & { id: string; titulo: string; completada: boolean };

// Días hasta el vencimiento efectivo (0 = hoy, negativo = vencida); null si no tiene fecha
function diasHastaVencer(tarea: TareaRecurrente, ahora: Date, zonaHoraria: string): number | null {
  return calcularSemaforo({
    vencimiento: vencimientoEfectivo(tarea),
    estado: tarea.estado,
    hoy: ahora,
    zona: zonaHoraria,
  }).diasRestantes;
}

function estaSilenciada(tarea: TareaRecurrente): boolean {
  return tarea.estado !== undefined && estadoSinAviso(tarea.estado);
}

// Tareas abiertas que vencen hoy, ya vencieron o, por su recurrencia, tocan hoy y no se completaron hoy
function tareasQueAvisanHoy<T extends TareaNotificable>(
  tareas: T[],
  ahora: Date,
  zonaHoraria: string,
): Array<{ tarea: T; dias: number | null }> {
  return tareas
    .filter((t) => !t.completada && !estaSilenciada(t))
    .map((tarea) => ({ tarea, dias: diasHastaVencer(tarea, ahora, zonaHoraria) }))
    .filter(
      ({ tarea, dias }) =>
        (dias !== null && dias <= 0) || correspondeHoy(tarea, ahora, zonaHoraria),
    );
}

// Medianoche UTC de la fecha local en la zona: estable todo el día para que la clave única deduplique
function fechaLocalDelDia(ahora: Date, zonaHoraria: string): Date {
  return new Date(`${claveDiaLocal(ahora, zonaHoraria)}T00:00:00.000Z`);
}

// Fecha local en la zona con formato AAAA-MM-DD
function claveDiaLocal(ahora: Date, zonaHoraria: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

// Hora local HH:mm en la zona indicada
function horaLocal(fecha: Date, zonaHoraria: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: zonaHoraria,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

// Reuniones que empiezan en los próximos 15 min (aviso "urgente")
function reunionesEnVentana(reuniones: EventoCalendario[], ahora: Date): EventoCalendario[] {
  const inicioVentana = new Date(ahora);
  const finVentana = new Date(ahora.getTime() + VENTANA_MINUTOS * 60 * 1000);

  return reuniones.filter((r) => {
    const inicioUtc = new Date(r.inicio);
    return inicioUtc >= inicioVentana && inicioUtc <= finVentana;
  });
}

// Reuniones que empiezan en 1 a 5 días (aviso "próximamente")
function reunionesPronto(reuniones: EventoCalendario[], ahora: Date): EventoCalendario[] {
  const inicio = new Date(ahora);
  const fin = new Date(ahora);
  fin.setDate(fin.getDate() + DIAS_AVISO_PRONTO);
  return reuniones.filter((r) => {
    const inicioUtc = new Date(r.inicio);
    return inicioUtc > inicio && inicioUtc <= fin;
  });
}

// Reuniones en ventana de 15 min (urgente) y tareas que vencen, vencieron o tocan hoy (TAREA_VENCE_HOY)
export function generarNotificaciones(
  reuniones: EventoCalendario[],
  tareas: Array<TareaNotificable>,
  ahora: Date,
  zonaHoraria: string,
): NotificacionPorGenerar[] {
  const resultado: NotificacionPorGenerar[] = [];

  for (const reunion of reunionesEnVentana(reuniones, ahora)) {
    resultado.push({
      tipo: "REUNION_PROXIMA",
      referenciaId: reunion.idExterno,
      titulo: "Reunión próxima",
      mensaje: `La reunión "${reunion.titulo}" comienza a las ${horaLocal(new Date(reunion.inicio), zonaHoraria)}.`,
      fechaEvento: new Date(reunion.inicio),
    });
  }

  for (const { tarea, dias } of tareasQueAvisanHoy(tareas, ahora, zonaHoraria)) {
    const { titulo, mensaje } = textoAvisoHoy(tarea.titulo, dias);
    resultado.push({
      tipo: "TAREA_VENCE_HOY",
      referenciaId: tarea.id,
      titulo,
      mensaje,
      fechaEvento: fechaLocalDelDia(ahora, zonaHoraria),
    });
  }

  return resultado;
}

// Reuniones en 1-5 días: una notificación por reunión y día de aviso. El campo tipo reutiliza
// "REUNION_PROXIMA" porque el enum de la BD no admite valores nuevos; la diferenciación entre
// la ventana de 15 min (urgente) y la de 1-5 días (próximamente) la hace prioridad.ts por minutos.
export function generarAvisosReunionesPronto(
  reuniones: EventoCalendario[],
  ahora: Date,
  zonaHoraria: string,
): NotificacionPorGenerar[] {
  const resultado: NotificacionPorGenerar[] = [];
  for (const reunion of reunionesPronto(reuniones, ahora)) {
    const inicio = new Date(reunion.inicio);
    const horas = Math.max(1, Math.round((inicio.getTime() - ahora.getTime()) / 3_600_000));
    const dia = Math.max(1, Math.ceil(horas / 24));
    resultado.push({
      tipo: "REUNION_PROXIMA",
      referenciaId: reunion.idExterno,
      titulo: "Reunión próxima",
      mensaje:
        dia === 1
          ? `La reunión "${reunion.titulo}" es mañana a las ${horaLocal(inicio, zonaHoraria)}.`
          : `La reunión "${reunion.titulo}" es en ${dia} días (${horaLocal(inicio, zonaHoraria)}).`,
      // Misma fecha exacta de inicio que el aviso de 15 min: prioridad.ts la usa para clasificar por minutos.
      fechaEvento: inicio,
    });
  }
  return resultado;
}

// Título y mensaje según el vencimiento: vencida (dias < 0), vence hoy (0) o pendiente de hoy
function textoAvisoHoy(
  tituloTarea: string,
  dias: number | null,
): { titulo: string; mensaje: string } {
  if (dias !== null && dias < 0) {
    const atras = -dias;
    return {
      titulo: "Tarea vencida",
      mensaje: `La tarea "${tituloTarea}" está vencida desde hace ${atras} ${atras === 1 ? "día" : "días"}.`,
    };
  }
  if (dias === 0) {
    return { titulo: "Tarea vence hoy", mensaje: `La tarea "${tituloTarea}" vence hoy.` };
  }
  return {
    titulo: "Tarea pendiente",
    mensaje: `La tarea "${tituloTarea}" aún no está completada hoy.`,
  };
}

// Tareas abiertas que vencen en 1 a 5 días: una notificación por tarea y por día de aviso
export function generarAvisosPronto(
  tareas: Array<TareaNotificable>,
  ahora: Date,
  zonaHoraria: string,
): NotificacionPorGenerar[] {
  const resultado: NotificacionPorGenerar[] = [];
  for (const tarea of tareas) {
    if (estaSilenciada(tarea)) continue;
    const dias = diasHastaVencer(tarea, ahora, zonaHoraria);
    if (dias === null || dias < 1 || dias > DIAS_AVISO_PRONTO) continue;
    resultado.push({
      tipo: "TAREA_VENCE_PRONTO",
      referenciaId: tarea.id,
      titulo: "Tarea por vencer",
      mensaje:
        dias === 1
          ? `La tarea "${tarea.titulo}" vence mañana.`
          : `La tarea "${tarea.titulo}" vence en ${dias} días.`,
      fechaEvento: fechaLocalDelDia(ahora, zonaHoraria),
    });
  }
  return resultado;
}

// Cantidad de tareas que vencen hoy o ya vencieron y siguen abiertas (sin contar pausadas)
export function contarTareasQueVencen(
  tareas: Array<TareaNotificable>,
  ahora: Date,
  zonaHoraria: string,
): number {
  return tareasQueAvisanHoy(tareas, ahora, zonaHoraria).length;
}

function textoCantidad(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

// Resumen del día: una notificación por fecha local; no se genera si no hay reuniones ni tareas
export function generarResumenDia(
  reunionesHoy: number,
  tareasQueVencen: number,
  ahora: Date,
  zonaHoraria: string,
): NotificacionPorGenerar | null {
  if (reunionesHoy <= 0 && tareasQueVencen <= 0) return null;

  const reuniones = textoCantidad(reunionesHoy, "reunión", "reuniones");
  const tareas = `${textoCantidad(tareasQueVencen, "tarea", "tareas")} que ${tareasQueVencen === 1 ? "vence" : "vencen"}`;
  let mensaje: string;
  if (reunionesHoy > 0 && tareasQueVencen > 0) mensaje = `Hoy tienes ${reuniones} y ${tareas}.`;
  else if (reunionesHoy > 0) mensaje = `Hoy tienes ${reuniones}.`;
  else mensaje = `Hoy tienes ${tareas}.`;

  return {
    tipo: "RESUMEN_DIA",
    referenciaId: claveDiaLocal(ahora, zonaHoraria),
    titulo: "Resumen del día",
    mensaje,
    fechaEvento: fechaLocalDelDia(ahora, zonaHoraria),
  };
}
