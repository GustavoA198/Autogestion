// Formato de presentación de la bitácora: lógica pura, sin React ni acceso a BD.

// Minutos como texto corto: "45 min", "2 h", "1 h 30 min"
export function formatearMinutos(minutos: number): string {
  const total = Math.max(0, Math.round(minutos));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

// Días transcurridos como texto: "hoy", "ayer", "hace 3 días"
export function textoHace(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

// Texto en una sola línea, recortado con puntos suspensivos
export function resumirTexto(texto: string, maximo: number): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > maximo ? `${limpio.slice(0, maximo - 1).trimEnd()}…` : limpio;
}

// Suma los minutos de una lista, ignorando las entradas sin tiempo registrado
export function sumarMinutos(entradas: { minutos: number | null }[]): number {
  return entradas.reduce((total, e) => total + (e.minutos ?? 0), 0);
}
