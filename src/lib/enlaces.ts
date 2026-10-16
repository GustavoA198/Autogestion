import { enlaceSeguro } from "@/lib/calendario/proveedor";

// Convierte un texto libre en un enlace abrible: sin esquema se asume https, y solo se admite http o https
export function hrefDeDireccion(texto: string | null | undefined): string | undefined {
  const limpio = texto?.trim();
  if (!limpio) return undefined;
  if (/^https?:\/\//i.test(limpio)) return enlaceSeguro(limpio);
  // Cualquier otro esquema (javascript:, data:, mailto:) o texto con espacios no es un destino válido
  if (/\s/.test(limpio) || /^[a-z][a-z0-9+.-]*:/i.test(limpio.replace(/:\d+(\/|$)/, "$1"))) {
    return undefined;
  }
  return enlaceSeguro(`https://${limpio}`);
}
