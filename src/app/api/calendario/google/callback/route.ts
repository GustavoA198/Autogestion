// Intercambia el código OAuth por tokens y los guarda cifrados
import { NextRequest, NextResponse } from "next/server";
import { obtenerGoogleProveedor } from "@/lib/calendario/google/proveedor-google";
import { sincronizarReuniones } from "@/lib/calendario/operaciones";

export async function GET(solicitud: NextRequest) {
  const code = solicitud.nextUrl.searchParams.get("code");
  const error = solicitud.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/calendario?error=oauth-${error}`, solicitud.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/calendario?error=oauth-sin-code", solicitud.url));
  }

  try {
    const proveedor = obtenerGoogleProveedor();
    await proveedor.guardarTokensDesdeCode(code);
    // Sincroniza las primeras reuniones tras conectar
    await sincronizarReuniones(proveedor);
    return NextResponse.redirect(new URL("/calendario?conectado=google", solicitud.url));
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.redirect(
      new URL(`/calendario?error=sync-${encodeURIComponent(mensaje)}`, solicitud.url),
    );
  }
}
