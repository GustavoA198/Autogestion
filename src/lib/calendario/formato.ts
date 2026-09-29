// Textos del calendario en español: títulos de rango, etiquetas de día y horas.
import {
  compararDias,
  diaCivilDe,
  diaCivilUTC,
  diaDeSemana,
  diferenciaDias,
  minutosDelDia,
  sumarDias,
  type DiaCivil,
} from "./fechas";
import type { Vista } from "./rango";

export const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const MESES_CORTOS = [
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
] as const;

// Indexados con 0 = lunes, igual que diaDeSemana
export const NOMBRES_DIA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export const DIAS_CORTOS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;

// Iniciales para el encabezado del mini calendario
export const INICIALES_DIA = ["L", "M", "X", "J", "V", "S", "D"] as const;

export function nombreMes(mes: number): string {
  return NOMBRES_MES[mes - 1];
}

export function nombreDia(dia: DiaCivil): string {
  return NOMBRES_DIA[diaDeSemana(dia)];
}

export function diaCorto(dia: DiaCivil): string {
  return DIAS_CORTOS[diaDeSemana(dia)];
}

// "septiembre de 2026"
export function tituloMes(dia: DiaCivil): string {
  return `${nombreMes(dia.mes)} de ${dia.anio}`;
}

// "jueves 24 de septiembre"; con el año si no es el de referencia o si se pide
export function fechaLarga(dia: DiaCivil, referencia?: DiaCivil, conAnio = false): string {
  const base = `${nombreDia(dia)} ${dia.dia} de ${nombreMes(dia.mes)}`;
  const mostrarAnio = conAnio || (referencia !== undefined && referencia.anio !== dia.anio);
  return mostrarAnio ? `${base} de ${dia.anio}` : base;
}

// "24 sep" o "24 sep 2026"
export function fechaCorta(dia: DiaCivil, conAnio = false): string {
  const base = `${dia.dia} ${MESES_CORTOS[dia.mes - 1]}`;
  return conAnio ? `${base} ${dia.anio}` : base;
}

// Rango inclusivo en formato compacto: "21–27 sep 2026", "28 sep – 4 oct 2026" o con dos años
export function rangoCorto(desde: DiaCivil, hasta: DiaCivil): string {
  if (compararDias(desde, hasta) >= 0) return fechaCorta(desde, true);
  if (desde.anio !== hasta.anio) return `${fechaCorta(desde, true)} – ${fechaCorta(hasta, true)}`;
  if (desde.mes !== hasta.mes) return `${fechaCorta(desde)} – ${fechaCorta(hasta, true)}`;
  return `${desde.dia}–${hasta.dia} ${MESES_CORTOS[desde.mes - 1]} ${desde.anio}`;
}

// "Hoy", "Mañana", "Ayer" o la fecha larga del día
export function etiquetaDia(dia: DiaCivil, hoy: DiaCivil): string {
  const diferencia = diferenciaDias(hoy, dia);
  if (diferencia === 0) return "Hoy";
  if (diferencia === 1) return "Mañana";
  if (diferencia === -1) return "Ayer";
  return fechaLarga(dia, hoy);
}

// Título de la barra superior según la vista; desde/hasta es el rango visible con hasta exclusivo
export function tituloRango(
  vista: Vista,
  ancla: DiaCivil,
  hoy: DiaCivil,
  rango: { desde: DiaCivil; hasta: DiaCivil },
): string {
  if (vista === "mes") return tituloMes(ancla);
  if (vista === "dia") return fechaLarga(ancla, hoy);
  return rangoCorto(rango.desde, sumarDias(rango.hasta, -1));
}

function dosDigitos(numero: number): string {
  return String(numero).padStart(2, "0");
}

// "16:00" en la zona indicada
export function formatoHora(instante: Date | number, zona: string): string {
  const minutos = minutosDelDia(instante, zona);
  return `${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`;
}

// Etiqueta de la hora de la cuadrícula: 0 -> "00:00"
export function etiquetaHora(hora: number): string {
  return `${dosDigitos(hora)}:00`;
}

type ReunionTiempo = { inicio: Date | string; fin: Date | string; diaCompleto: boolean };

// Días civiles que abarca un evento de día completo; hasta es exclusivo y siempre hay al menos uno
export function diasDeDiaCompleto(reunion: ReunionTiempo): { desde: DiaCivil; hasta: DiaCivil } {
  const desde = diaCivilUTC(new Date(reunion.inicio));
  const finExclusivo = diaCivilUTC(new Date(reunion.fin));
  return {
    desde,
    hasta: compararDias(finExclusivo, desde) > 0 ? finExclusivo : sumarDias(desde, 1),
  };
}

// "10:00 – 11:00" o "Todo el día"
export function rangoHoras(reunion: ReunionTiempo, zona: string): string {
  if (reunion.diaCompleto) return "Todo el día";
  return `${formatoHora(new Date(reunion.inicio), zona)} – ${formatoHora(new Date(reunion.fin), zona)}`;
}

// Fecha legible de una reunión; los eventos de día completo se leen como fecha, sin corrimiento
export function fechaDeReunion(reunion: ReunionTiempo, zona: string, hoy?: DiaCivil): string {
  if (reunion.diaCompleto) {
    const { desde, hasta } = diasDeDiaCompleto(reunion);
    const ultimo = sumarDias(hasta, -1);
    if (compararDias(desde, ultimo) === 0) return fechaLarga(desde, hoy, true);
    return `${fechaLarga(desde, undefined, false)} al ${fechaLarga(ultimo, undefined, true)}`;
  }
  return fechaLarga(diaCivilDe(new Date(reunion.inicio), zona), hoy, true);
}

// Texto relativo de la última actualización: "Actualizado ahora", "Actualizado hace 5 min"
export function textoActualizado(ultimaMs: number, ahoraMs: number): string {
  const minutos = Math.max(0, Math.floor((ahoraMs - ultimaMs) / 60_000));
  if (minutos < 1) return "Actualizado ahora";
  if (minutos < 60) return `Actualizado hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Actualizado hace ${horas} h`;
  return `Actualizado hace ${Math.floor(horas / 24)} d`;
}
