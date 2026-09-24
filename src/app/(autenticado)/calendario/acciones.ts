"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import { obtenerGoogleProveedor } from "@/lib/calendario/google/proveedor-google";
import { obtenerMicrosoftProveedor } from "@/lib/calendario/microsoft/proveedor-microsoft";
import {
  cuentaEstaConectada,
  desconectarCalendario,
  guardarReunion,
  listarReunionesLocales,
  obtenerCuentaCalendario,
  sincronizarReuniones,
} from "@/lib/calendario/operaciones";
import type { ErrorCalendario, ProveedorCalendario } from "@/lib/calendario/proveedor";
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
    proveedor: formulario.get("proveedor"),
  };
}

function obtenerProveedorYCuenta(tipo: "GOOGLE" | "MICROSOFT") {
  if (tipo === "GOOGLE") {
    return { proveedor: obtenerGoogleProveedor(), cuenta: obtenerCuentaCalendario("GOOGLE") };
  }
  return { proveedor: obtenerMicrosoftProveedor(), cuenta: obtenerCuentaCalendario("MICROSOFT") };
}

// Crea una reunión en el calendario seleccionado y la guarda en la BD local
export async function accionCrearReunion(
  _anterior: EstadoReunion,
  formulario: FormData,
): Promise<EstadoReunion> {
  await exigirSesion();
  const { titulo, descripcion, inicio, fin, proveedor } = leerCampos(formulario);

  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    return { errores: { mensaje: "El título es obligatorio." } };
  }
  if (!inicio || typeof inicio !== "string") {
    return { errores: { mensaje: "La fecha de inicio es obligatoria." } };
  }
  if (!fin || typeof fin !== "string") {
    return { errores: { mensaje: "La fecha de fin es obligatoria." } };
  }

  const tipoProveedor = proveedor === "MICROSOFT" ? "MICROSOFT" : "GOOGLE";

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return { errores: { mensaje: "Las fechas no son válidas." } };
  }
  if (fechaFin <= fechaInicio) {
    return { errores: { mensaje: "La fecha de fin debe ser posterior a la de inicio." } };
  }

  try {
    const { proveedor: prov, cuenta } = obtenerProveedorYCuenta(tipoProveedor);
    if (!prov.estaConfigurado()) {
      return {
        errores: {
          mensaje:
            tipoProveedor === "GOOGLE"
              ? "Google Calendar no está configurado. Agrega las variables en .env."
              : "Microsoft Calendar no está configurado. Agrega las variables en .env.",
        },
      };
    }
    const cuentaDb = await cuenta;
    if (!cuentaDb || !cuentaDb.refreshTokenCifrado) {
      return {
        errores: {
          mensaje:
            tipoProveedor === "GOOGLE"
              ? "Cuenta de Google Calendar no conectada."
              : "Cuenta de Microsoft Calendar no conectada.",
        },
      };
    }

    const evento = await prov.crearEvento({
      titulo: titulo.trim(),
      descripcion: typeof descripcion === "string" ? descripcion.trim() : undefined,
      inicio: fechaInicio,
      fin: fechaFin,
    });
    await guardarReunion(tipoProveedor, evento, cuentaDb.id);
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

// Desconecta la cuenta del calendario seleccionado
export async function accionDesconectarCalendario(
  proveedor: "GOOGLE" | "MICROSOFT" = "GOOGLE",
): Promise<void> {
  await exigirSesion();
  await desconectarCalendario(proveedor);
  revalidatePath("/calendario");
}

// Sincroniza reuniones desde el calendario seleccionado
export type ResultadoSincronizacion =
  | { ok: true; cantidad: number }
  | { ok: false; codigo: ErrorCalendario["codigo"]; mensaje: string };

export async function accionSincronizarCalendario(
  proveedor: "GOOGLE" | "MICROSOFT" = "GOOGLE",
): Promise<ResultadoSincronizacion> {
  await exigirSesion();
  const prov = proveedor === "GOOGLE" ? obtenerGoogleProveedor() : obtenerMicrosoftProveedor();
  if (!prov.estaConfigurado()) {
    return {
      ok: false,
      codigo: "no-configurado",
      mensaje:
        proveedor === "GOOGLE"
          ? "Google Calendar no configurado."
          : "Microsoft Calendar no configurado.",
    };
  }
  try {
    const cantidad = await sincronizarReuniones(prov, proveedor);
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

// Verifica el estado de las conexiones de ambos calendarios
export async function obtenerEstadoCalendario(): Promise<{
  google: { conectado: boolean; configurado: boolean };
  microsoft: { conectado: boolean; configurado: boolean };
}> {
  await exigirSesion();
  const googleProveedor = obtenerGoogleProveedor();
  const microsoftProveedor = obtenerMicrosoftProveedor();
  const googleConfigurado = googleProveedor.estaConfigurado();
  const microsoftConfigurado = microsoftProveedor.estaConfigurado();
  const googleConectado = googleConfigurado ? await cuentaEstaConectada("GOOGLE") : false;
  const microsoftConectado = microsoftConfigurado ? await cuentaEstaConectada("MICROSOFT") : false;
  return {
    google: { configurado: googleConfigurado, conectado: googleConectado },
    microsoft: { configurado: microsoftConfigurado, conectado: microsoftConectado },
  };
}
