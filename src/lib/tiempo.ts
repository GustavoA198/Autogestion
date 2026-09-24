const UNIDADES: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

const formato = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

// Tiempo transcurrido en español ("hace 3 días"); menos de un minuto se muestra como "ahora"
export function tiempoRelativo(fecha: Date, ahora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((ahora.getTime() - fecha.getTime()) / 1000));
  for (const [unidad, tamano] of UNIDADES) {
    if (segundos >= tamano) return formato.format(-Math.floor(segundos / tamano), unidad);
  }
  return "ahora";
}
