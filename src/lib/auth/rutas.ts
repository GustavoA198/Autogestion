const RUTAS_PUBLICAS = new Set(["/login", "/api/health", "/api/auth"]);
const PREFIJO_AUTH = "/api/auth/";

export function esRutaPublica(ruta: string): boolean {
  return RUTAS_PUBLICAS.has(ruta) || ruta.startsWith(PREFIJO_AUTH);
}

// Acepta solo rutas internas para impedir redirecciones a otros sitios
export function rutaDestinoSegura(destino: string | null | undefined): string {
  if (!destino || !destino.startsWith("/") || destino.startsWith("//")) return "/";
  if (/[\\\u0000-\u001f]/.test(destino)) return "/";
  if (destino === "/login" || destino.startsWith("/login?")) return "/";
  return destino;
}
