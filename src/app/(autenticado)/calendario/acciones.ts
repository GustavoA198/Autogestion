"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import { obtenerGoogleProveedor } from "@/lib/calendario/google/proveedor-google";
import { obtenerMicrosoftProveedor } from "@/lib/calendario/microsoft/proveedor-microsoft";
import {
  desconectarCalendario,
  guardarReunion,
  listarReunionesEnRango,
  obtenerCuentaCalendario,
  sincronizarCalendario,
  type OrigenSincronizacion,
  type ReunionDetalle,
} from "@/lib/calendario/operaciones";
import { validarRangoConsulta } from "@/lib/calendario/rango";
import { validarRangoClaves, type EventoTarea } from "@/lib/calendario/tareas";
import { listarTareasEnRango } from "@/lib/calendario/tareas-rango";
import { ErrorCalendario as ErrorCalendarioBase } from "@/lib/calendario/proveedor";

export type EstadoReunion = {
  // Verdadero cuando la reunión se creó; la UI cierra el formulario y refresca el rango
  creada?: boolean;
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
  // Los valores enviados se devuelven con cada error para no perder lo que el usuario escribió
  const valores = {
    titulo: typeof titulo === "string" ? titulo : "",
    descripcion: typeof descripcion === "string" ? descripcion : "",
    inicio: typeof inicio === "string" ? inicio : "",
    fin: typeof fin === "string" ? fin : "",
  };

  if (!titulo || typeof titulo !== "string" || titulo.trim() === "") {
    return { errores: { mensaje: "El título es obligatorio." }, valores };
  }
  if (!inicio || typeof inicio !== "string") {
    return { errores: { mensaje: "La fecha de inicio es obligatoria." }, valores };
  }
  if (!fin || typeof fin !== "string") {
    return { errores: { mensaje: "La fecha de fin es obligatoria." }, valores };
  }

  const tipoProveedor = proveedor === "MICROSOFT" ? "MICROSOFT" : "GOOGLE";

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    return { errores: { mensaje: "Las fechas no son válidas." }, valores };
  }
  if (fechaFin <= fechaInicio) {
    return { errores: { mensaje: "La fecha de fin debe ser posterior a la de inicio." }, valores };
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
        valores,
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
        valores,
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
    return { creada: true };
  } catch (e) {
    const err = e instanceof ErrorCalendarioBase ? e : null;
    return {
      errores: { mensaje: err?.message ?? "Error al crear la reunión." },
      valores,
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
  | {
      ok: true;
      cantidad: number;
      // Verdadero si se guardó algo nuevo; la UI recarga el rango solo en ese caso
      huboCambios: boolean;
      // Verdadero si el límite de frecuencia evitó consultar al proveedor
      omitida?: boolean;
      // Fecha ISO de la última sincronización de la cuenta
      ultimaSincronizacion: string | null;
    }
  | { ok: false; codigo: ErrorCalendario["codigo"]; mensaje: string };

// El origen "auto" lo usa el disparo automático: respeta el límite de frecuencia y no revalida la página
export async function accionSincronizarCalendario(
  proveedor: "GOOGLE" | "MICROSOFT" = "GOOGLE",
  origen: OrigenSincronizacion = "manual",
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
    const modo = origen === "auto" ? "auto" : "manual";
    const resultado = await sincronizarCalendario(prov, proveedor, modo);
    // Revalidar dentro de una acción vuelve a renderizar la página actual, así que solo se hace en el modo manual
    if (modo === "manual") revalidatePath("/calendario");
    return {
      ok: true,
      cantidad: resultado.cantidad,
      huboCambios: resultado.huboCambios,
      omitida: resultado.omitida,
      ultimaSincronizacion: resultado.ultimaSincronizacion?.toISOString() ?? null,
    };
  } catch (e) {
    const err = e instanceof ErrorCalendarioBase ? e : null;
    // Sin cuenta conectada el disparo automático es esperable y no merece registro
    if (!(origen === "auto" && err?.codigo === "no-configurado")) {
      // Solo la última línea: los errores de Prisma vuelcan el evento completo
      const detalle = e instanceof Error ? (e.message.trim().split("\n").pop() ?? e.message) : e;
      console.error("Error al sincronizar calendario:", proveedor, detalle);
    }
    return {
      ok: false,
      codigo: err?.codigo ?? "desconocido",
      mensaje: err?.message ?? (e instanceof Error ? e.message : "Error al sincronizar."),
    };
  }
}

// Reuniones de la BD local que se solapan con [desde, hasta); las fechas llegan como ISO
export type ResultadoReunionesRango =
  { ok: true; reuniones: ReunionDetalle[] } | { ok: false; mensaje: string };

export async function obtenerReunionesEnRango(
  desde: string,
  hasta: string,
): Promise<ResultadoReunionesRango> {
  await exigirSesion();
  const rango = validarRangoConsulta(desde, hasta);
  if (!rango) return { ok: false, mensaje: "El rango de fechas no es válido." };
  try {
    return { ok: true, reuniones: await listarReunionesEnRango(rango.desde, rango.hasta) };
  } catch (e) {
    console.error("Error al listar reuniones del rango:", e instanceof Error ? e.message : e);
    return { ok: false, mensaje: "No se pudieron cargar las reuniones." };
  }
}

// Tareas abiertas con vencimiento en [desde, hasta); las fechas llegan como AAAA-MM-DD
export type ResultadoTareasRango =
  { ok: true; tareas: EventoTarea[] } | { ok: false; mensaje: string };

export async function obtenerTareasEnRango(
  desde: string,
  hasta: string,
  incluirVencidas: boolean,
): Promise<ResultadoTareasRango> {
  await exigirSesion();
  const rango = validarRangoClaves(desde, hasta);
  if (!rango) return { ok: false, mensaje: "El rango de fechas no es válido." };
  try {
    return {
      ok: true,
      tareas: await listarTareasEnRango(rango.desde, rango.hasta, incluirVencidas === true),
    };
  } catch (e) {
    console.error("Error al listar tareas del rango:", e instanceof Error ? e.message : e);
    return { ok: false, mensaje: "No se pudieron cargar las tareas." };
  }
}

// Verifica el estado de las conexiones de ambos calendarios
type EstadoConexion = {
  conectado: boolean;
  configurado: boolean;
  // Fecha ISO de la última sincronización correcta de la cuenta
  ultimaSincronizacion: string | null;
};

// Lee la cuenta una sola vez para saber si está conectada y cuándo se sincronizó por última vez
async function estadoDeProveedor(
  tipo: "GOOGLE" | "MICROSOFT",
  configurado: boolean,
): Promise<EstadoConexion> {
  if (!configurado) return { configurado, conectado: false, ultimaSincronizacion: null };
  const cuenta = await obtenerCuentaCalendario(tipo);
  return {
    configurado,
    conectado: Boolean(cuenta?.refreshTokenCifrado),
    ultimaSincronizacion: cuenta?.ultimaSincronizacion?.toISOString() ?? null,
  };
}

export async function obtenerEstadoCalendario(): Promise<{
  google: EstadoConexion;
  microsoft: EstadoConexion;
}> {
  await exigirSesion();
  const [google, microsoft] = await Promise.all([
    estadoDeProveedor("GOOGLE", obtenerGoogleProveedor().estaConfigurado()),
    estadoDeProveedor("MICROSOFT", obtenerMicrosoftProveedor().estaConfigurado()),
  ]);
  return { google, microsoft };
}
