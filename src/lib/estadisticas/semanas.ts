// Utilidades de semanas continuas (lunes a domingo) para las estadísticas; funciones puras.
import { fechaInicioSemana } from "@/lib/estadisticas/calculos";
import {
  claveDeFecha,
  claveHoyLocal,
  inicioDelDiaEnZona,
  lunesDeSemana,
  sumarDias,
} from "@/lib/notas/periodo";

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export type DatoSemanal = { semana: string; valor: number };

// Claves aaaa-mm-dd de los lunes de las últimas n semanas, de la más antigua a la actual
export function semanasDelPeriodo(hoy: Date, cantidad: number, zona: string): string[] {
  const lunesActual = fechaInicioSemana(hoy, zona);
  const total = Math.max(1, Math.floor(cantidad));
  return Array.from({ length: total }, (_, i) =>
    claveDeFecha(sumarDias(lunesActual, (i - (total - 1)) * 7)),
  );
}

// Primer día del periodo como fecha pura (medianoche UTC)
export function inicioDelPeriodo(semanas: string[]): Date {
  return new Date(`${semanas[0]}T00:00:00.000Z`);
}

// Último día del periodo (domingo de la semana actual) como fecha pura
export function finDelPeriodo(semanas: string[]): Date {
  return sumarDias(new Date(`${semanas[semanas.length - 1]}T00:00:00.000Z`), 6);
}

// Instantes [desde, hasta) que cubren el periodo completo en la zona horaria
export function instantesDelPeriodo(semanas: string[], zona: string): { desde: Date; hasta: Date } {
  return {
    desde: inicioDelDiaEnZona(inicioDelPeriodo(semanas), zona),
    hasta: inicioDelDiaEnZona(sumarDias(finDelPeriodo(semanas), 1), zona),
  };
}

// Semana (clave del lunes) de una fecha pura guardada a medianoche UTC
export function claveSemanaDeFechaPura(fecha: Date): string {
  return claveDeFecha(lunesDeSemana(fecha));
}

// Semana (clave del lunes) de un instante, según el día local de la zona
export function claveSemanaDeInstante(instante: Date, zona: string): string {
  return claveDeFecha(fechaInicioSemana(instante, zona));
}

// Día local (aaaa-mm-dd) de un instante
export function claveDiaDeInstante(instante: Date, zona: string): string {
  return claveHoyLocal(zona, instante);
}

// Etiqueta corta es-CO de una semana: "21 sep"
export function etiquetaSemana(clave: string): string {
  const [, mes, dia] = clave.split("-").map(Number);
  return `${dia} ${MESES_CORTOS[mes - 1] ?? ""}`.trim();
}

// Suma valores por semana y devuelve todas las semanas del periodo, con ceros donde no hay datos
export function completarSemanas(semanas: string[], acumulado: Map<string, number>): DatoSemanal[] {
  return semanas.map((semana) => ({ semana, valor: acumulado.get(semana) ?? 0 }));
}
