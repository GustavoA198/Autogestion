import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { esRutaPublica } from "@/lib/auth/rutas";

export async function proxy(solicitud: NextRequest) {
  const { pathname, search } = solicitud.nextUrl;

  if (esRutaPublica(pathname)) return NextResponse.next();
  if (await getToken({ req: solicitud })) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const destino = solicitud.nextUrl.clone();
  destino.pathname = "/login";
  destino.search = "";
  destino.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
