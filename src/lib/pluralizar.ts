// Concordancia de número en español: "1 pendiente", "2 pendientes".
export function pluralizar(cantidad: number, singular: string, plural: string): string {
  return cantidad === 1 ? singular : plural;
}

// Cantidad con su palabra concordada: "1 urgente", "3 urgentes"
export function conCantidad(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${pluralizar(cantidad, singular, plural)}`;
}
