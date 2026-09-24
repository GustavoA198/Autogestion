// Server actions para notificaciones.
"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  contarNotificaciones,
  descartarNotificacion,
  descartarTodasNotificaciones,
  generarYGuardarNotificaciones,
  listarNotificaciones,
} from "@/lib/notificaciones/operaciones";

export async function accionContarNotificaciones(): Promise<number> {
  await exigirSesion();
  return contarNotificaciones();
}

export async function accionListarNotificaciones() {
  await exigirSesion();
  return listarNotificaciones();
}

export async function accionDescartarNotificacion(id: string): Promise<boolean> {
  await exigirSesion();
  const resultado = await descartarNotificacion(id);
  revalidatePath("/notificaciones");
  return resultado;
}

export async function accionDescartarTodasNotificaciones(): Promise<number> {
  await exigirSesion();
  const cantidad = await descartarTodasNotificaciones();
  revalidatePath("/notificaciones");
  return cantidad;
}

export async function accionGenerarNotificaciones(): Promise<number> {
  await exigirSesion();
  return generarYGuardarNotificaciones();
}
