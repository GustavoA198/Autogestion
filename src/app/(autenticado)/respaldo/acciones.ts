// Server actions para respaldo y restauracion de la base de datos
"use server";

import { revalidatePath } from "next/cache";
import { exigirSesion } from "@/lib/auth/sesion";
import { generarVolcadoSql } from "@/lib/respaldo/volcar";
import { restaurarDesdeSql } from "@/lib/respaldo/restaurar";
import { subirARive } from "@/lib/respaldo/drive";
import { obtenerPrisma } from "@/lib/prisma";
import type { Respaldo, EstadoRespaldo } from "@/generated/prisma/client";

function formatearFecha(): string {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");
  const hours = String(ahora.getHours()).padStart(2, "0");
  const minutes = String(ahora.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}-${hours}${minutes}`;
}

export async function generarRespaldo(
  folderId?: string,
): Promise<{ ok: boolean; mensaje?: string; driveFileId?: string }> {
  await exigirSesion();

  let datos: Buffer;
  try {
    datos = await generarVolcadoSql();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido al generar volcado";
    return { ok: false, mensaje: msg };
  }

  const nombreArchivo = `autogestion-respaldo-${formatearFecha()}.sql.gz`;

  let driveFileId: string;
  try {
    driveFileId = await subirARive(datos, nombreArchivo, folderId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido al subir a Drive";
    // Registra como fallido
    await obtenerPrisma().respaldo.create({
      data: {
        nombreArchivo,
        estado: "FALLIDO" as EstadoRespaldo,
        mensajeError: msg,
      },
    });
    return { ok: false, mensaje: msg };
  }

  // Registra como exitoso
  await obtenerPrisma().respaldo.create({
    data: {
      nombreArchivo,
      driveFileId,
      tamanoBytes: datos.length,
      estado: "COMPLETADO" as EstadoRespaldo,
    },
  });

  revalidatePath("/respaldo");
  return { ok: true, driveFileId };
}

export async function restaurarRespaldo(sql: Buffer): Promise<{ ok: boolean; mensaje?: string }> {
  await exigirSesion();

  try {
    await restaurarDesdeSql(sql);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido al restaurar";
    return { ok: false, mensaje: msg };
  }
}

export async function obtenerRespaldos(): Promise<Respaldo[]> {
  await exigirSesion();

  const respaldos = await obtenerPrisma().respaldo.findMany({
    orderBy: { fechaCreacion: "desc" },
    take: 20,
  });

  return respaldos;
}

export async function obtenerEstadoDrive(): Promise<{
  conectado: boolean;
  mensaje?: string;
}> {
  await exigirSesion();

  try {
    const cuenta = await obtenerPrisma().cuentaCalendario.findUnique({
      where: { proveedor_usuarioId: { proveedor: "GOOGLE", usuarioId: "unico" } },
    });

    if (!cuenta || !cuenta.refreshTokenCifrado) {
      return {
        conectado: false,
        mensaje:
          "Drive no conectado. Conecta tu cuenta de Google en la seccion Calendario y reconnwala para otorgar acceso a Drive.",
      };
    }

    return { conectado: true };
  } catch {
    return { conectado: false, mensaje: "Error al verificar estado de Drive." };
  }
}
