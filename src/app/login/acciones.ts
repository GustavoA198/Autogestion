// Consulta de arranque: distingue "no hay usuario" de "credenciales incorrectas" en el login
"use server";

import { existeUsuario } from "@/lib/usuarios/operaciones";

export async function usuarioConfigurado(): Promise<boolean> {
  return existeUsuario();
}
