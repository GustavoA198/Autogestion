import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { leerEntornoBaseDatos } from "@/lib/env";

const global_ = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: leerEntornoBaseDatos().DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Instancia perezosa para que el build no exija la base de datos
export function obtenerPrisma(): PrismaClient {
  global_.prisma ??= crearCliente();
  return global_.prisma;
}
