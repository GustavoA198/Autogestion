import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/opciones";

export function obtenerSesion() {
  return getServerSession(authOptions);
}

// Segunda capa de defensa: cada página verifica la sesión aunque el proxy ya lo haga
export async function exigirSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  return sesion;
}
