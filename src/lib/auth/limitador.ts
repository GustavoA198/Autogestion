import { createHash } from "node:crypto";
import { obtenerPrisma } from "@/lib/prisma";

export const POLITICA_ACCESO = {
  ventanaMs: 15 * 60 * 1000,
  maxPorIp: 5,
  maxGlobal: 100,
} as const;

const CLAVE_GLOBAL = "global";

type Cabeceras = Record<string, string | string[] | undefined>;

// Toma la primera IP de x-forwarded-for; la plataforma de despliegue debe fijar esa cabecera
export function obtenerIp(cabeceras: Cabeceras): string {
  const reenviado = cabeceras["x-forwarded-for"];
  const valor = Array.isArray(reenviado) ? reenviado[0] : reenviado;
  return valor?.split(",")[0]?.trim() || "desconocida";
}

// Guarda solo un resumen de la IP para no almacenar datos personales
export function claveDeIp(ip: string): string {
  return `ip:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

export function limiteAlcanzado(intentosIp: number, intentosGlobal: number): boolean {
  return intentosIp >= POLITICA_ACCESO.maxPorIp || intentosGlobal >= POLITICA_ACCESO.maxGlobal;
}

export function limiteSuperado(intentosIp: number, intentosGlobal: number): boolean {
  return intentosIp > POLITICA_ACCESO.maxPorIp || intentosGlobal > POLITICA_ACCESO.maxGlobal;
}

async function contarIntentos(claveIp: string, desde: Date): Promise<[number, number]> {
  const prisma = obtenerPrisma();
  return Promise.all([
    prisma.intentoAcceso.count({ where: { clave: claveIp, creadoEn: { gte: desde } } }),
    prisma.intentoAcceso.count({ where: { clave: CLAVE_GLOBAL, creadoEn: { gte: desde } } }),
  ]);
}

// Devuelve true si el acceso está bloqueado; un bloqueo activo no guarda más filas
export async function registrarIntento(ip: string, ahora = new Date()): Promise<boolean> {
  const prisma = obtenerPrisma();
  const claveIp = claveDeIp(ip);
  const desde = new Date(ahora.getTime() - POLITICA_ACCESO.ventanaMs);

  await prisma.intentoAcceso.deleteMany({ where: { creadoEn: { lt: desde } } });

  if (limiteAlcanzado(...(await contarIntentos(claveIp, desde)))) return true;

  // Se registra antes de verificar la clave y se recuenta para cubrir las peticiones paralelas
  await prisma.intentoAcceso.createMany({
    data: [
      { clave: claveIp, creadoEn: ahora },
      { clave: CLAVE_GLOBAL, creadoEn: ahora },
    ],
  });

  return limiteSuperado(...(await contarIntentos(claveIp, desde)));
}

// Tras un acceso correcto se reinicia el contador de esa IP
export async function reiniciarIntentos(ip: string): Promise<void> {
  await obtenerPrisma().intentoAcceso.deleteMany({ where: { clave: claveDeIp(ip) } });
}
