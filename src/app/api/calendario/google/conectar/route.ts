// Redirige a Google OAuth para autorizar el acceso a Calendar
import { NextResponse } from "next/server";
import { obtenerGoogleProveedor } from "@/lib/calendario/google/proveedor-google";

export async function GET() {
  const proveedor = obtenerGoogleProveedor();
  if (!proveedor.estaConfigurado()) {
    return NextResponse.json(
      { error: "Variables de Google Calendar no configuradas en .env." },
      { status: 503 },
    );
  }
  const url = proveedor.generarUrlAutenticacion();
  return NextResponse.redirect(url);
}
