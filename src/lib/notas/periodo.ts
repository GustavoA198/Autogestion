// Períodos y rangos de la bitácora. Nota.fecha es una fecha pura guardada a medianoche UTC.
import { fechaInicioSemana } from "@/lib/estadisticas/calculos";

export type PeriodoNotas = "semana" | "mes" | "todo";

export const ETIQUETA_PERIODO: Record<PeriodoNotas, string> = {
  semana: "Esta semana",
  mes: "Este mes",
  todo: "Todo",
};

export const PERIODOS_NOTAS: PeriodoNotas[] = ["semana", "mes", "todo"];

// Rango de fechas puras (medianoche UTC), ambos extremos incluidos
export type RangoFechas = { desde: Date; hasta: Date };

const DIA_MS = 24 * 60 * 60 * 1000;

// Lee el parámetro ?periodo= de la URL; por defecto Todo
export function leerPeriodo(valor: string | string[] | undefined): PeriodoNotas {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return PERIODOS_NOTAS.includes(texto as PeriodoNotas) ? (texto as PeriodoNotas) : "todo";
}

// Día local de hoy en la zona horaria como texto aaaa-mm-dd
export function claveHoyLocal(zona: string, ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

// Convierte aaaa-mm-dd a fecha pura (medianoche UTC); null si el texto no es una fecha real
export function fechaDeClave(clave: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clave);
  if (!m) return null;
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return claveDeFecha(fecha) === clave ? fecha : null;
}

// Clave aaaa-mm-dd de una fecha pura
export function claveDeFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * DIA_MS);
}

// Días de calendario entre dos fechas puras (hasta menos desde)
export function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / DIA_MS);
}

// Fecha pura del día local de hoy
export function hoyComoFecha(zona: string, ahora: Date = new Date()): Date {
  return fechaDeClave(claveHoyLocal(zona, ahora)) as Date;
}

// Lunes de la semana que contiene la fecha pura indicada
export function lunesDeSemana(fecha: Date): Date {
  return fechaInicioSemana(new Date(fecha.getTime() + DIA_MS / 2), "UTC");
}

// Semana completa lunes a domingo a partir de su lunes
export function rangoSemana(lunes: Date): RangoFechas {
  return { desde: lunes, hasta: sumarDias(lunes, 6) };
}

// Rango del período elegido respecto de hoy local; undefined significa sin límite
export function rangoDePeriodo(
  periodo: PeriodoNotas,
  zona: string,
  ahora: Date = new Date(),
): RangoFechas | undefined {
  if (periodo === "todo") return undefined;
  const hoy = hoyComoFecha(zona, ahora);
  if (periodo === "semana") return rangoSemana(lunesDeSemana(hoy));
  const desde = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const hasta = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0));
  return { desde, hasta };
}

// Instante en que empieza el día indicado (fecha pura) en la zona horaria
export function inicioDelDiaEnZona(fecha: Date, zona: string): Date {
  const utc = fecha.getTime();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utc));
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  const visto = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour"),
    valor("minute"),
    valor("second"),
  );
  return new Date(utc - (visto - utc));
}
