// Acceso a la tabla de usuarios; el hash de la contraseña nunca sale de acá

import { randomBytes } from "node:crypto";
import { generarHash, verificarClave } from "@/lib/auth/clave";
import { obtenerPrisma } from "@/lib/prisma";

export type Usuario = {
  id: string;
  nombre: string;
  claveHash: string;
  creadoEn: Date;
  actualizadoEn: Date;
};

// Derivado de un valor aleatorio y guardado solo en memoria: nada con forma de llave en el código
let hashSenuelo: Promise<string> | null = null;

function obtenerHashSenuelo(): Promise<string> {
  hashSenuelo ??= generarHash(randomBytes(32).toString("hex"));
  return hashSenuelo;
}

export type ResultadoCredenciales = { ok: true; usuario: Usuario } | { ok: false };

export async function obtenerUsuarioPorNombre(nombre: string): Promise<Usuario | null> {
  return obtenerPrisma().usuario.findUnique({ where: { nombre } });
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  return obtenerPrisma().usuario.findUnique({ where: { id } });
}

// Distingue "no hay usuario configurado" de "las credenciales están mal"
export async function existeUsuario(): Promise<boolean> {
  return (await obtenerPrisma().usuario.count()) > 0;
}

// Si el nombre no existe se deriva igual la clave contra el hash señuelo: si no, el tiempo de
// respuesta revelaría qué nombres de usuario están dados de alta
export async function verificarCredenciales(
  nombre: string,
  clave: string,
): Promise<ResultadoCredenciales> {
  const usuario = await obtenerUsuarioPorNombre(nombre);
  if (!usuario) {
    await verificarClave(clave, await obtenerHashSenuelo());
    return { ok: false };
  }
  if (!(await verificarClave(clave, usuario.claveHash))) return { ok: false };
  return { ok: true, usuario };
}

export async function crearUsuario(nombre: string, clave: string): Promise<Usuario> {
  return obtenerPrisma().usuario.create({
    data: { nombre, claveHash: await generarHash(clave) },
  });
}

export async function actualizarClave(id: string, clave: string): Promise<Usuario> {
  return obtenerPrisma().usuario.update({
    where: { id },
    data: { claveHash: await generarHash(clave) },
  });
}
