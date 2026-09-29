// Textos en español para mostrar la frecuencia de una tarea.
export const FRECUENCIA_LABEL: Record<string, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  PUNTUAL: "Puntual",
};

// Textos en español para el estado de una tarea.
export const ESTADO_LABEL: Record<string, string> = {
  NUEVA: "Nueva",
  EN_DESARROLLO: "En desarrollo",
  PAUSADA: "Pausada",
  BLOQUEADA: "Bloqueada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

// Textos en español para la prioridad de una tarea.
export const PRIORIDAD_LABEL: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

// Fecha larga es-CO ("24 sept 2026"); las columnas de fecha se leen en UTC para no correr el día
export function formatearFecha(fecha: Date | null | undefined): string {
  if (!fecha) return "Sin fecha";
  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Fecha corta "28 sep" para chips compactos; sin año ni día de la semana
export function formatearFechaCorta(fecha: Date | null | undefined): string {
  if (!fecha) return "";
  return fecha.toLocaleDateString("es-CO", { month: "short", day: "numeric", timeZone: "UTC" });
}

// Rango de trabajo de una tarea: "Del 1 sept 2026 al 30 sept 2026", "Desde ...", "Hasta ..."
export function rangoFechasTexto(
  fechaInicio: Date | null | undefined,
  fechaLimite: Date | null | undefined,
): string {
  if (fechaInicio && fechaLimite) {
    return `Del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaLimite)}`;
  }
  if (fechaInicio) return `Desde ${formatearFecha(fechaInicio)}`;
  if (fechaLimite) return `Hasta ${formatearFecha(fechaLimite)}`;
  return "Sin fechas";
}

const DIA_SEMANA_LABEL = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type DatosFrecuencia = {
  tipoFrecuencia: string;
  diaSemana: number | null;
  diaMes: number | null;
  fechaPuntual: Date | null;
};

// Descripción corta de cuándo toca la tarea: "Cada lunes", "Día 15", "sin fecha"
// La fecha completa de vencimiento se muestra en un chip separado (fechaLimite)
export function frecuenciaDetalle(tarea: DatosFrecuencia): string {
  switch (tarea.tipoFrecuencia) {
    case "DIARIA":
      return "Cada día";
    case "SEMANAL":
      return `Cada ${DIA_SEMANA_LABEL[tarea.diaSemana ?? 0]}`;
    case "MENSUAL":
      return `Día ${tarea.diaMes} de cada mes`;
    case "PUNTUAL":
      return tarea.fechaPuntual ? formatearFechaCorta(tarea.fechaPuntual) : "sin fecha";
    default:
      return "";
  }
}
