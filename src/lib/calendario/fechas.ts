// Fechas civiles (año, mes, día) y conversión con zonas horarias IANA, sin dependencias externas.

// Día del calendario sin hora ni zona; el mes va de 1 a 12
export type DiaCivil = { anio: number; mes: number; dia: number };

export const ZONA_PREDETERMINADA = "America/Bogota";

const MS_MINUTO = 60_000;
const MS_HORA = 3_600_000;
const MS_DIA = 86_400_000;
const PASO_AJUSTE_MS = 15 * MS_MINUTO;
const LIMITE_AJUSTE = 200;

function relleno(numero: number, largo: number): string {
  return String(numero).padStart(largo, "0");
}

// Milisegundos UTC de la medianoche de un día; setUTCFullYear evita que 0-99 se lea como 1900-1999
function msUTC(anio: number, mes: number, dia: number): number {
  const fecha = new Date(0);
  fecha.setUTCFullYear(anio, mes - 1, dia);
  return fecha.getTime();
}

function msDeDia(dia: DiaCivil): number {
  return msUTC(dia.anio, dia.mes, dia.dia);
}

function diaDesdeMs(ms: number): DiaCivil {
  const fecha = new Date(ms);
  return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1, dia: fecha.getUTCDate() };
}

export function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

export function diasEnMes(anio: number, mes: number): number {
  if (mes === 2) return esBisiesto(anio) ? 29 : 28;
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

// Normaliza desbordes: crearDia(2026, 9, 31) devuelve el 1 de octubre
export function crearDia(anio: number, mes: number, dia: number): DiaCivil {
  return diaDesdeMs(msUTC(anio, mes, dia));
}

export function sumarDias(dia: DiaCivil, cantidad: number): DiaCivil {
  return diaDesdeMs(msDeDia(dia) + cantidad * MS_DIA);
}

// Conserva el día del mes y lo recorta al último día si el mes destino es más corto
export function sumarMeses(dia: DiaCivil, cantidad: number): DiaCivil {
  const total = dia.anio * 12 + (dia.mes - 1) + cantidad;
  const anio = Math.floor(total / 12);
  const mes = total - anio * 12 + 1;
  return { anio, mes, dia: Math.min(dia.dia, diasEnMes(anio, mes)) };
}

export function primerDiaDelMes(dia: DiaCivil): DiaCivil {
  return { anio: dia.anio, mes: dia.mes, dia: 1 };
}

// Días desde a hasta b; positivo si b es posterior
export function diferenciaDias(a: DiaCivil, b: DiaCivil): number {
  return Math.round((msDeDia(b) - msDeDia(a)) / MS_DIA);
}

export function compararDias(a: DiaCivil, b: DiaCivil): number {
  return Math.sign(msDeDia(a) - msDeDia(b));
}

export function mismoDia(a: DiaCivil, b: DiaCivil): boolean {
  return a.anio === b.anio && a.mes === b.mes && a.dia === b.dia;
}

// La semana empieza en lunes: 0 = lunes, 6 = domingo
export function diaDeSemana(dia: DiaCivil): number {
  return (new Date(msDeDia(dia)).getUTCDay() + 6) % 7;
}

export function inicioDeSemana(dia: DiaCivil): DiaCivil {
  return sumarDias(dia, -diaDeSemana(dia));
}

// Clave ordenable y estable ("2026-09-24") para mapas y comparaciones
export function claveDia(dia: DiaCivil): string {
  return `${relleno(dia.anio, 4)}-${relleno(dia.mes, 2)}-${relleno(dia.dia, 2)}`;
}

export function diaDesdeClave(clave: string): DiaCivil | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clave);
  if (!coincidencia) return null;
  const dia = crearDia(Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3]));
  return claveDia(dia) === clave ? dia : null;
}

export function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

// Zona horaria del navegador (o la predeterminada si no se puede determinar)
export function zonaDelNavegador(): string {
  try {
    const zona = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zona && zonaValida(zona) ? zona : ZONA_PREDETERMINADA;
  } catch {
    return ZONA_PREDETERMINADA;
  }
}

const formateadores = new Map<string, Intl.DateTimeFormat>();

function formateadorDe(zona: string): Intl.DateTimeFormat {
  let formateador = formateadores.get(zona);
  if (!formateador) {
    formateador = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formateadores.set(zona, formateador);
  }
  return formateador;
}

export type PartesLocales = DiaCivil & { hora: number; minuto: number; segundo: number };

function aMs(instante: Date | number): number {
  return typeof instante === "number" ? instante : instante.getTime();
}

// Fecha y hora de pared de un instante en la zona indicada
export function partesEnZona(instante: Date | number, zona: string): PartesLocales {
  const valores: Record<string, number> = {};
  for (const parte of formateadorDe(zona).formatToParts(aMs(instante))) {
    if (parte.type !== "literal") valores[parte.type] = Number(parte.value);
  }
  return {
    anio: valores.year,
    mes: valores.month,
    dia: valores.day,
    hora: valores.hour % 24,
    minuto: valores.minute,
    segundo: valores.second,
  };
}

export function diaCivilDe(instante: Date | number, zona: string): DiaCivil {
  const { anio, mes, dia } = partesEnZona(instante, zona);
  return { anio, mes, dia };
}

// Minutos transcurridos desde las 00:00 de pared en la zona
export function minutosDelDia(instante: Date | number, zona: string): number {
  const { hora, minuto } = partesEnZona(instante, zona);
  return hora * 60 + minuto;
}

// Diferencia entre la hora de pared y UTC en ese instante (positivo al este de Greenwich)
function desfaseMs(instante: number, zona: string): number {
  const p = partesEnZona(instante, zona);
  const comoUTC =
    msUTC(p.anio, p.mes, p.dia) + p.hora * MS_HORA + p.minuto * MS_MINUTO + p.segundo * 1000;
  return comoUTC - Math.floor(instante / 1000) * 1000;
}

const cacheInicios = new Map<string, number>();

// Primer instante del día en la zona; tolera horarios de verano y cambios a medianoche
export function inicioDelDia(dia: DiaCivil, zona: string): Date {
  const clave = `${zona}|${claveDia(dia)}`;
  const guardado = cacheInicios.get(clave);
  if (guardado !== undefined) return new Date(guardado);

  const objetivo = msDeDia(dia);
  const marca = (ms: number) => msDeDia(diaCivilDe(ms, zona));
  let candidato = objetivo - desfaseMs(objetivo, zona);
  candidato = objetivo - desfaseMs(candidato, zona);
  for (let i = 0; i < LIMITE_AJUSTE && marca(candidato) > objetivo; i++) {
    candidato -= PASO_AJUSTE_MS;
  }
  for (let i = 0; i < LIMITE_AJUSTE && marca(candidato) < objetivo; i++) {
    candidato += PASO_AJUSTE_MS;
  }
  for (let i = 0; i < LIMITE_AJUSTE && marca(candidato - PASO_AJUSTE_MS) === objetivo; i++) {
    candidato -= PASO_AJUSTE_MS;
  }

  if (cacheInicios.size > 4000) cacheInicios.clear();
  cacheInicios.set(clave, candidato);
  return new Date(candidato);
}

// Fecha UTC de un instante: así se guardan los eventos de día completo, sin corrimiento por zona
export function diaCivilUTC(instante: Date | number): DiaCivil {
  return diaDesdeMs(aMs(instante));
}

// Valor para un campo datetime-local ("2026-09-24T10:30") en la zona indicada
export function formatoDatetimeLocal(instante: Date | number, zona: string): string {
  const p = partesEnZona(instante, zona);
  return `${claveDia(p)}T${relleno(p.hora, 2)}:${relleno(p.minuto, 2)}`;
}
