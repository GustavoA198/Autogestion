import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/opciones";

export function obtenerSesion() {
  return getServerSession(authOptions);
}

// Segunda capa de defensa: el layout del grupo (autenticado) la exige aunque el proxy ya filtre las rutas
export async function exigirSesion() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  return sesion;
}
