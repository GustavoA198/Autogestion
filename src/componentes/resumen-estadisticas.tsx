// Datos de barras por semana que reutiliza el dashboard; el resto de las estadísticas vive en estadisticas/.
type DatoSemana = { semana: string; cantidad: number };

export function formatearSemana(fechaStr: string): string {
  const fecha = new Date(fechaStr);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(fecha);
}

function textoTareas(cantidad: number): string {
  return `${cantidad} tarea${cantidad !== 1 ? "s" : ""} completada${cantidad !== 1 ? "s" : ""}`;
}

export function barrasPorSemana(datosSemana: DatoSemana[]) {
  return datosSemana.map((d) => ({
    etiqueta: formatearSemana(d.semana),
    cantidad: d.cantidad,
    ariaLabel: `Semana del ${formatearSemana(d.semana)}: ${textoTareas(d.cantidad)}`,
    detalle: `Semana del ${formatearSemana(d.semana)}`,
  }));
}
