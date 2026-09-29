// Server actions para notificaciones.
"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import { listarReunionesEnRango } from "@/lib/calendario/operaciones";
import {
  contarNotificacionesPriorizadas,
  descartarNotificacion,
  descartarTodasNotificaciones,
  generarYGuardarNotificaciones,
  listarNotificacionesPriorizadas,
} from "@/lib/notificaciones/operaciones";
import type { NotificacionPriorizada } from "@/lib/notificaciones/prioridad";

// Totales de la campana: pendientes y cuántos son urgentes
export type ConteoNotificaciones = { total: number; urgentes: number };

export async function accionContarNotificaciones(): Promise<ConteoNotificaciones> {
  await exigirSesion();
  return contarNotificacionesPriorizadas();
}

// Lista ya clasificada por severidad y ordenada, con el enlace de cada tarjeta
export async function accionListarNotificaciones(): Promise<NotificacionPriorizada[]> {
  await exigirSesion();
  return listarNotificacionesPriorizadas();
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

// Genera las notificaciones pendientes y devuelve el desglose (lo usa el indicador de la cabecera)
export async function accionGenerarYContarNotificaciones(): Promise<ConteoNotificaciones> {
  await exigirSesion();
  await generarYGuardarNotificaciones();
  return contarNotificacionesPriorizadas();
}

// Reunión próxima para el aviso del navegador; el inicio viaja como texto ISO
export type ReunionAviso = { id: string; titulo: string; inicio: string };

const HORAS_ADELANTE_AVISOS = 3;
const MAX_REUNIONES_AVISO = 30;

// Reuniones con hora que empiezan en las próximas horas; canceladas y de día completo no se avisan
export async function accionReunionesProximas(): Promise<ReunionAviso[]> {
  await exigirSesion();
  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + HORAS_ADELANTE_AVISOS * 3_600_000);
  const reuniones = await listarReunionesEnRango(ahora, hasta);
  return reuniones
    .filter((r) => !r.diaCompleto && r.estado !== "cancelled" && r.inicio > ahora)
    .slice(0, MAX_REUNIONES_AVISO)
    .map((r) => ({ id: r.id, titulo: r.titulo, inicio: r.inicio.toISOString() }));
}
