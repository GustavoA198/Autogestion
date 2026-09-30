// Deja la base lista para las pruebas: crea el usuario de e2e con su contraseña conocida
import "dotenv/config";
import { generarHash } from "@/lib/auth/clave";
import { obtenerPrisma } from "@/lib/prisma";
import { CLAVE_E2E, USUARIO_E2E } from "./soporte";

const HOSTS_PERMITIDOS = ["localhost", "127.0.0.1", "[::1]"];

// Una URL vacía o mal formada no se puede leer; se trata como no local para que la guarda cierre
function leerHost(origen: string | undefined): string | null {
  try {
    return new URL(origen ?? "").hostname;
  } catch {
    return null;
  }
}

export default async function prepararBase() {
  const host = leerHost(process.env.DATABASE_URL);

  // Crear un usuario de contraseña conocida en producción sería dejar una puerta abierta
  if (!host || !HOSTS_PERMITIDOS.includes(host)) {
    throw new Error(
      `Las pruebas de extremo a extremo solo corren contra la base local. Host actual: ${host ?? "sin definir o con formato inválido"}`,
    );
  }

  const prisma = obtenerPrisma();
  const claveHash = await generarHash(CLAVE_E2E);

  await prisma.usuario.upsert({
    where: { nombre: USUARIO_E2E },
    update: { claveHash },
    create: { nombre: USUARIO_E2E, claveHash },
  });

  await prisma.$disconnect();
}
