import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { leerEntornoBaseDatos } from "@/lib/env";

const global_ = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente(): PrismaClient {
  const entorno = leerEntornoBaseDatos();
  // En Vercel el runtime usa pooling; connection_limit=1 es seguro con pgbouncer
  const url = entorno.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

// Instancia perezosa para que el build no exija la base de datos
export function obtenerPrisma(): PrismaClient {
  global_.prisma ??= crearCliente();
  return global_.prisma;
}

/**
 * URL directa para migraciones: sin pooling de pgbouncer.
 * - Vercel: usar DIRECT_URL (migraciones van contra la base directamente).
 * - Local/Docker: DATABASE_URL es directa; DIRECT_URL se ignora.
 * La cadena debe incluir ?connection_limit=1 si hay pgbouncer en medio.
 */
export function urlMigraciones(): string {
  const directo = process.env.DIRECT_URL;
  // Solo usar DIRECT_URL si tiene contenido; una cadena vacia no es valida
  if (directo && directo.length > 0) return directo;
  return leerEntornoBaseDatos().DATABASE_URL;
}
