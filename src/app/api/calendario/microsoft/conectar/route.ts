// Redirige a Microsoft OAuth para autorizar el acceso a Calendar
import { NextResponse } from "next/server";
import { obtenerMicrosoftProveedor } from "@/lib/calendario/microsoft/proveedor-microsoft";

export async function GET() {
  const proveedor = obtenerMicrosoftProveedor();
  if (!proveedor.estaConfigurado()) {
    return NextResponse.json(
      { error: "Variables de Microsoft Calendar no configuradas en .env." },
      { status: 503 },
    );
  }
  const url = proveedor.generarUrlAutenticacion();
  return NextResponse.redirect(url);
}
