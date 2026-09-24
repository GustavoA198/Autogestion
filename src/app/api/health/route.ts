import { NextResponse } from "next/server";
import { obtenerPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Confirma que la aplicación está viva y que la base de datos responde
export async function GET() {
  try {
    await obtenerPrisma().$queryRaw`SELECT 1`;
    return NextResponse.json({ estado: "ok", baseDatos: "conectada" });
  } catch (error) {
    console.error(
      "Fallo en la verificación de salud:",
      error instanceof Error ? error.message : "desconocido",
    );
    return NextResponse.json({ estado: "error", baseDatos: "sin conexión" }, { status: 503 });
  }
}
