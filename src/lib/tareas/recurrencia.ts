/**
 * Parsea una fecha UTC-interpreted extrayendo sus partes en una zona horaria específica.
 * Así todos los helpers operan en la misma zona sin importar cómo se creó el Date.
 */
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

/**
 * Día del mes (1-31) en la zona horaria.
 */
function diaDelMes(fecha: Date, zonaHoraria: string): number {
  return fechaEnZona(fecha, zonaHoraria).dia;
}

/**
 * Último día del mes (28-31) en la zona horaria.
 */
function ultimoDiaDelMes(fecha: Date, zonaHoraria: string): number {
  const { anio, mes } = fechaEnZona(fecha, zonaHoraria);
  // Primer día del mes siguiente, menos un día
  const ultimo = new Date(anio, mes, 0);
  return fechaEnZona(ultimo, zonaHoraria).dia;
}

/**
 * Día de la semana (0=domingo a 6=sábado) en la zona horaria.
 */
function diaDeLaSemana(fecha: Date, zonaHoraria: string): number {
  const { anio, mes, dia } = fechaEnZona(fecha, zonaHoraria);
  const local = new Date(anio, mes - 1, dia, 12, 0, 0);
  return local.getDay();
}

export type TareaRecurrente = {
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
};

/**
 * Determina si una tarea corresponde a un día given.
 * - DIARIA: siempre
 * - SEMANAL: diaSemana debe coincidir (0=domingo a 6=sábado)
 * - MENSUAL: diaMes coincide, o es el último día del mes y diaMes > último día real
 * - PUNTUAL: fechaPuntual coincide (solo la fecha, sin hora)
 */
export function correspondeHoy(tarea: TareaRecurrente, fecha: Date, zonaHoraria: string): boolean {
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
      if (!tarea.fechaPuntual) return false;
      const a = fechaEnZona(fecha, zonaHoraria);
      const b = fechaEnZona(tarea.fechaPuntual, zonaHoraria);
      return a.anio === b.anio && a.mes === b.mes && a.dia === b.dia;
    }

    default:
      return false;
  }
}

/**
 * Dado un array de tareas, devuelve solo las que corresponden a la fecha given.
 */
export function filtrarTareasDeHoy<T extends TareaRecurrente>(
  tareas: T[],
  fecha: Date,
  zonaHoraria: string,
): T[] {
  return tareas.filter((tarea) => correspondeHoy(tarea, fecha, zonaHoraria));
}
