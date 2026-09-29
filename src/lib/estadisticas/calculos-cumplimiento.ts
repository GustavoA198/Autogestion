// Cálculos puros de cumplimiento: tareas completadas por semana y puntualidad; sin base de datos.
import type { TareaEstadistica } from "@/lib/estadisticas/calculos-tareas";
import {
  claveDiaDeInstante,
  claveSemanaDeFechaPura,
  completarSemanas,
  type DatoSemanal,
} from "@/lib/estadisticas/semanas";
import { claveDeFecha, claveHoyLocal } from "@/lib/notas/periodo";
import { vencimientoEfectivo } from "@/lib/tareas/semaforo";

type DatosVencimiento = Pick<TareaEstadistica, "fechaLimite" | "fechaPuntual">;

// Marca de cumplimiento de una tarea en un día (tabla TareaCompletada) con los datos de su tarea
export type MarcaCumplimiento = {
  tareaId: string;
  fecha: Date;
  tarea: DatosVencimiento & { proyectoId: string | null };
};

// Tarea completada un día concreto; vencimiento es null si la tarea no tenía fecha
export type EventoCompletado = {
  tareaId: string;
  dia: string;
  vencimiento: string | null;
  proyectoId: string | null;
};

// Día de vencimiento (aaaa-mm-dd): "hasta" es fecha pura y el día puntual con hora se lee en la zona
export function claveVencimiento(tarea: DatosVencimiento, zona: string): string | null {
  const fecha = vencimientoEfectivo(tarea);
  if (!fecha) return null;
  const soloFecha =
    tarea.fechaLimite !== null ||
    (fecha.getUTCHours() === 0 &&
      fecha.getUTCMinutes() === 0 &&
      fecha.getUTCSeconds() === 0 &&
      fecha.getUTCMilliseconds() === 0);
  return soloFecha ? claveDeFecha(fecha) : claveHoyLocal(zona, fecha);
}

// Une las marcas diarias con las cerradas por estado sin marca (estas cuentan por el día local de su última edición)
export function eventosCompletados(
  marcas: MarcaCumplimiento[],
  tareasCompletadas: TareaEstadistica[],
  zona: string,
): EventoCompletado[] {
  const eventos = new Map<string, EventoCompletado>();
  const conMarca = new Set<string>();
  for (const marca of marcas) {
    conMarca.add(marca.tareaId);
    const dia = claveDeFecha(marca.fecha);
    eventos.set(`${marca.tareaId}|${dia}`, {
      tareaId: marca.tareaId,
      dia,
      vencimiento: claveVencimiento(marca.tarea, zona),
      proyectoId: marca.tarea.proyectoId,
    });
  }
  for (const tarea of tareasCompletadas) {
    if (tarea.estado !== "COMPLETADA" || conMarca.has(tarea.id)) continue;
    const dia = claveDiaDeInstante(tarea.actualizadoEn, zona);
    eventos.set(`${tarea.id}|${dia}`, {
      tareaId: tarea.id,
      dia,
      vencimiento: claveVencimiento(tarea, zona),
      proyectoId: tarea.proyectoId,
    });
  }
  return Array.from(eventos.values());
}

function semanaDeEvento(evento: EventoCompletado): string {
  return claveSemanaDeFechaPura(new Date(`${evento.dia}T00:00:00.000Z`));
}

// Completadas por semana del periodo, con ceros en las semanas sin actividad
export function completadasPorSemana(
  eventos: EventoCompletado[],
  semanas: string[],
): DatoSemanal[] {
  const acumulado = new Map<string, number>();
  for (const evento of eventos) {
    const semana = semanaDeEvento(evento);
    acumulado.set(semana, (acumulado.get(semana) ?? 0) + 1);
  }
  return completarSemanas(semanas, acumulado);
}

export type PuntualidadSemana = {
  semana: string;
  aTiempo: number;
  tarde: number;
  sinFecha: number;
};

// Completadas a tiempo, tarde y sin fecha de vencimiento por semana del periodo
export function puntualidadPorSemana(
  eventos: EventoCompletado[],
  semanas: string[],
): PuntualidadSemana[] {
  const mapa = new Map<string, Omit<PuntualidadSemana, "semana">>();
  for (const evento of eventos) {
    const semana = semanaDeEvento(evento);
    const fila = mapa.get(semana) ?? { aTiempo: 0, tarde: 0, sinFecha: 0 };
    if (evento.vencimiento === null) fila.sinFecha += 1;
    else if (evento.dia <= evento.vencimiento) fila.aTiempo += 1;
    else fila.tarde += 1;
    mapa.set(semana, fila);
  }
  return semanas.map((semana) => ({
    semana,
    ...(mapa.get(semana) ?? { aTiempo: 0, tarde: 0, sinFecha: 0 }),
  }));
}

export type ResumenPuntualidad = {
  conVencimiento: number;
  aTiempo: number;
  // Entero de 0 a 100; null si ninguna completada tenía fecha de vencimiento
  porcentaje: number | null;
};

// Porcentaje de completadas cuyo día efectivo es igual o anterior a su vencimiento
export function porcentajeATiempo(eventos: EventoCompletado[]): ResumenPuntualidad {
  let conVencimiento = 0;
  let aTiempo = 0;
  for (const evento of eventos) {
    if (evento.vencimiento === null) continue;
    conVencimiento += 1;
    if (evento.dia <= evento.vencimiento) aTiempo += 1;
  }
  return {
    conVencimiento,
    aTiempo,
    porcentaje: conVencimiento === 0 ? null : Math.round((aTiempo / conVencimiento) * 100),
  };
}

// Promedio de completadas por semana sobre todas las semanas del periodo, con un decimal
export function promedioSemanal(datos: DatoSemanal[]): number {
  if (datos.length === 0) return 0;
  const total = datos.reduce((suma, dato) => suma + dato.valor, 0);
  return Math.round((total / datos.length) * 10) / 10;
}
