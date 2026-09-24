"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import { obtenerGoogleProveedor } from "@/lib/calendario/google/proveedor-google";
import {
  cuentaEstaConectada,
  desconectarCalendario,
  guardarReunion,
  listarReunionesLocales,
  obtenerCuentaCalendario,
  sincronizarReuniones,
} from "@/lib/calendario/operaciones";
import type { ErrorCalendario } from "@/lib/calendario/proveedor";
import { ErrorCalendario as ErrorCalendarioBase } from "@/lib/calendario/proveedor";

export type EstadoReunion = {
  errores?: { mensaje?: string };
  valores?: { titulo?: string; descripcion?: string; inicio?: string; fin?: string };
};

function leerCampos(formulario: FormData) {
  return {
    titulo: formulario.get("titulo"),
    descripcion: formulario.get("descripcion"),
    inicio: formulario.get("inicio"),
    fin: formulario.get("fin"),
  };
}

// Crea una reunión en Google Calendar y la guarda en la BD local
export async function accionCrearReunion(
  _anterior: EstadoReunion,
  formulario: FormData,
): Promise<EstadoReunion> {
  await exigirSesion();
  const { titulo, descripcion, inicio, fin } = leerCampos(formulario);

  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    return { errores: { mensaje: "El título es obligatorio." } };
  }
  if (!inicio || typeof inicio !== "string") {
    return { errores: { mensaje: "La fecha de inicio es obligatoria." } };
  }
  if (!fin || typeof fin !== "string") {
    return { errores: { mensaje: "La fecha de fin es obligatoria." } };
  }

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return { errores: { mensaje: "Las fechas no son válidas." } };
  }
  if (fechaFin <= fechaInicio) {
    return { errores: { mensaje: "La fecha de fin debe ser posterior a la de inicio." } };
  }

  try {
    const proveedor = obtenerGoogleProveedor();
    if (!proveedor.estaConfigurado()) {
      return {
        errores: { mensaje: "Google Calendar no está configurado. Agrega las variables en .env." },
      };
    }
    const cuenta = await obtenerCuentaCalendario("GOOGLE");
    if (!cuenta || !cuenta.refreshTokenCifrado) {
      return { errores: { mensaje: "Cuenta de Google Calendar no conectada." } };
    }

    const evento = await proveedor.crearEvento({
      titulo: titulo.trim(),
      descripcion: typeof descripcion === "string" ? descripcion.trim() : undefined,
      inicio: fechaInicio,
      fin: fechaFin,
    });
    await guardarReunion("GOOGLE", evento, cuenta.id);
    revalidatePath("/calendario");
    return {};
  } catch (e) {
    const err = e instanceof ErrorCalendarioBase ? e : null;
    return {
      errores: { mensaje: err?.message ?? "Error al crear la reunión." },
      valores: { titulo: String(titulo), descripcion: String(descripcion ?? ""), inicio, fin },
    };
  }
}

// Desconecta la cuenta de Google Calendar y elimina las reuniones sincronizadas
export async function accionDesconectarCalendario(): Promise<void> {
  await exigirSesion();
  await desconectarCalendario("GOOGLE");
  revalidatePath("/calendario");
}

// Sincroniza reuniones desde Google Calendar
export type ResultadoSincronizacion =
  | { ok: true; cantidad: number }
  | { ok: false; codigo: ErrorCalendario["codigo"]; mensaje: string };

export async function accionSincronizarCalendario(): Promise<ResultadoSincronizacion> {
  await exigirSesion();
  const proveedor = obtenerGoogleProveedor();
  if (!proveedor.estaConfigurado()) {
    return { ok: false, codigo: "no-configurado", mensaje: "Google Calendar no configurado." };
  }
  try {
    const cantidad = await sincronizarReuniones(proveedor);
    revalidatePath("/calendario");
    return { ok: true, cantidad };
  } catch (e) {
    const err = e instanceof ErrorCalendarioBase ? e : null;
    return {
      ok: false,
      codigo: err?.codigo ?? "desconocido",
      mensaje: err?.message ?? "Error al sincronizar.",
    };
  }
}

// Devuelve reuniones locales para la UI
export async function obtenerReunionesLocales(fechaInicio?: Date, fechaFin?: Date) {
  await exigirSesion();
  return listarReunionesLocales(fechaInicio, fechaFin);
}

// Verifica el estado de la conexión
export async function obtenerEstadoCalendario(): Promise<{
  conectado: boolean;
  configurado: boolean;
}> {
  await exigirSesion();
  const proveedor = obtenerGoogleProveedor();
  const configurado = proveedor.estaConfigurado();
  const conectado = configurado ? await cuentaEstaConectada("GOOGLE") : false;
  return { configurado, conectado };
}
