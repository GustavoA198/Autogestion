// Partes de la fecha (año, mes, día) en la zona horaria, sin importar cómo se creó el Date
function fechaEnZona(fecha: Date, zonaHoraria: string): { anio: number; mes: number; dia: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const partes = fmt.format(fecha).split("-").map(Number) as [number, number, number];
  return { anio: partes[0], mes: partes[1], dia: partes[2] };
}

// Último día del mes (28-31) en la zona horaria
function ultimoDiaDelMes(fecha: Date, zonaHoraria: string): number {
  const { anio, mes } = fechaEnZona(fecha, zonaHoraria);
  // Primer día del mes siguiente, menos un día
  const ultimo = new Date(anio, mes, 0);
  return fechaEnZona(ultimo, zonaHoraria).dia;
}

// Día de la semana (0=domingo a 6=sábado) en la zona horaria
function diaDeLaSemana(fecha: Date, zonaHoraria: string): number {
  const { anio, mes, dia } = fechaEnZona(fecha, zonaHoraria);
  const local = new Date(anio, mes - 1, dia, 12, 0, 0);
  return local.getDay();
}

// Estados que sacan a la tarea de la lista de hoy (BLOQUEADA sí aparece)
const ESTADOS_FUERA_DE_HOY = ["PAUSADA", "COMPLETADA", "CANCELADA"];

export type TareaRecurrente = {
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
  estado?: string;
  fechaInicio?: Date | null;
  fechaLimite?: Date | null;
};

// Entero comparable (aaaammdd) de una fecha de calendario
function claveDia(f: { anio: number; mes: number; dia: number }): number {
  return f.anio * 10000 + f.mes * 100 + f.dia;
}

// Las columnas de fecha sin hora se guardan a medianoche UTC: se leen por sus partes UTC
export function claveDiaUTC(fecha: Date): number {
  return claveDia({
    anio: fecha.getUTCFullYear(),
    mes: fecha.getUTCMonth() + 1,
    dia: fecha.getUTCDate(),
  });
}

// Día de una fecha en la zona horaria como entero aaaammdd
export function claveDiaEnZona(fecha: Date, zonaHoraria: string): number {
  return claveDia(fechaEnZona(fecha, zonaHoraria));
}

// Una fecha puntual a medianoche UTC exacta es solo fecha; con hora se lee en la zona
export function claveDiaPuntual(fecha: Date, zonaHoraria: string): number {
  const esSoloFecha =
    fecha.getUTCHours() === 0 &&
    fecha.getUTCMinutes() === 0 &&
    fecha.getUTCSeconds() === 0 &&
    fecha.getUTCMilliseconds() === 0;
  return esSoloFecha ? claveDiaUTC(fecha) : claveDia(fechaEnZona(fecha, zonaHoraria));
}

// Si la tarea toca en la fecha: nunca en PAUSADA/COMPLETADA/CANCELADA ni fuera de su rango; si no, según su frecuencia
export function correspondeHoy(tarea: TareaRecurrente, fecha: Date, zonaHoraria: string): boolean {
  if (tarea.estado && ESTADOS_FUERA_DE_HOY.includes(tarea.estado)) return false;

  const hoy = claveDia(fechaEnZona(fecha, zonaHoraria));
  const inicio = tarea.fechaInicio ? claveDiaUTC(tarea.fechaInicio) : null;
  const limite = tarea.fechaLimite ? claveDiaUTC(tarea.fechaLimite) : null;
  if (tarea.tipoFrecuencia !== "PUNTUAL") {
    if (inicio !== null && hoy < inicio) return false;
    if (limite !== null && hoy > limite) return false;
  }

  switch (tarea.tipoFrecuencia) {
    case "DIARIA":
      return true;

    case "SEMANAL":
      if (tarea.diaSemana === null) return false;
      return diaDeLaSemana(fecha, zonaHoraria) === tarea.diaSemana;

    case "MENSUAL": {
      if (tarea.diaMes === null) return false;
      const { dia: actual, mes, anio } = fechaEnZona(fecha, zonaHoraria);
      if (actual === tarea.diaMes) return true;
      // Si diaMes excede el mes (p.ej. 31 en abril), corresponde solo si hoy es el último día
      const ultimo = ultimoDiaDelMes(new Date(anio, mes - 1, 15), zonaHoraria);
      if (actual === ultimo && tarea.diaMes > ultimo) return true;
      return false;
    }

    case "PUNTUAL": {
      // Sin día ni fecha límite es un pendiente: nunca cuenta como "de hoy"
      const dia = tarea.fechaPuntual ? claveDiaPuntual(tarea.fechaPuntual, zonaHoraria) : limite;
      if (dia === null) return false;
      if (hoy === dia) return true;
      if (limite === null) return false;
      return hoy >= (inicio ?? dia) && hoy <= limite;
    }

    default:
      return false;
  }
}

// Solo las tareas que corresponden a la fecha
export function filtrarTareasDeHoy<T extends TareaRecurrente>(
  tareas: T[],
  fecha: Date,
  zonaHoraria: string,
): T[] {
  return tareas.filter((tarea) => correspondeHoy(tarea, fecha, zonaHoraria));
}
