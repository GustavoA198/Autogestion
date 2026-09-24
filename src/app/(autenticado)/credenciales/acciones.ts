"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  actualizarCredencial,
  crearCredencial,
  desvincularCredencial,
  eliminarCredencial,
  obtenerSecreto,
  vincularCredencial,
} from "@/lib/credenciales/operaciones";
import { validarCredencial, type ErroresCredencial } from "@/lib/credenciales/validacion";

// Nunca incluye el secreto: el usuario debe volver a escribirlo si el envío falla
export type ValoresCredencial = {
  nombre: string;
  categoria: string;
  usuario: string;
  host: string;
  nota: string;
  global: boolean;
  proyectoIds: string[];
};

export type EstadoFormularioCredencial = {
  errores?: ErroresCredencial;
  valores?: ValoresCredencial;
};

export type RespuestaSecreto = { ok: true; secreto: string } | { ok: false };

const ERROR_PROYECTO = "Alguno de los proyectos elegidos ya no existe.";

function leerCampos(formulario: FormData) {
  return {
    nombre: formulario.get("nombre"),
    categoria: formulario.get("categoria"),
    usuario: formulario.get("usuario"),
    secreto: formulario.get("secreto"),
    host: formulario.get("host"),
    nota: formulario.get("nota"),
    global: formulario.get("global") === "on",
    proyectoIds: formulario.getAll("proyectoIds"),
  };
}

function valoresEscritos(campos: ReturnType<typeof leerCampos>): ValoresCredencial {
  const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");
  return {
    nombre: texto(campos.nombre),
    categoria: texto(campos.categoria),
    usuario: texto(campos.usuario),
    host: texto(campos.host),
    nota: texto(campos.nota),
    global: campos.global,
    proyectoIds: campos.proyectoIds.filter((id): id is string => typeof id === "string"),
  };
}

export async function accionCrearCredencial(
  _anterior: EstadoFormularioCredencial,
  formulario: FormData,
): Promise<EstadoFormularioCredencial> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarCredencial(campos, { secretoObligatorio: true });
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await crearCredencial(validado.datos);
  if (!resultado.ok) {
    return { errores: { proyectoIds: ERROR_PROYECTO }, valores: valoresEscritos(campos) };
  }

  revalidatePath("/credenciales");
  redirect(`/credenciales/${resultado.id}`);
}

export async function accionEditarCredencial(
  id: string,
  _anterior: EstadoFormularioCredencial,
  formulario: FormData,
): Promise<EstadoFormularioCredencial> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarCredencial(campos, { secretoObligatorio: false });
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await actualizarCredencial(id, validado.datos);
  if (!resultado) notFound();
  if (!resultado.ok) {
    return { errores: { proyectoIds: ERROR_PROYECTO }, valores: valoresEscritos(campos) };
  }

  revalidatePath("/credenciales");
  revalidatePath("/proyectos", "layout");
  redirect(`/credenciales/${id}`);
}

export async function accionEliminarCredencial(id: string): Promise<void> {
  await exigirSesion();
  await eliminarCredencial(id);
  revalidatePath("/credenciales");
  revalidatePath("/proyectos", "layout");
  redirect("/credenciales");
}

// Único camino por el que el secreto llega al navegador, y solo bajo demanda
export async function revelarSecreto(id: string): Promise<RespuestaSecreto> {
  await exigirSesion();
  if (typeof id !== "string" || id === "") return { ok: false };
  try {
    const secreto = await obtenerSecreto(id);
    return secreto === null ? { ok: false } : { ok: true, secreto };
  } catch {
    return { ok: false };
  }
}

function leerCredencialId(formulario: FormData): string | null {
  const valor = formulario.get("credencialId");
  return typeof valor === "string" && valor !== "" ? valor : null;
}

export async function accionVincularCredencial(
  proyectoId: string,
  formulario: FormData,
): Promise<void> {
  await exigirSesion();
  const credencialId = leerCredencialId(formulario);
  if (!credencialId) return;
  await vincularCredencial(credencialId, proyectoId);
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath("/credenciales");
}

export async function accionDesvincularCredencial(
  proyectoId: string,
  formulario: FormData,
): Promise<void> {
  await exigirSesion();
  const credencialId = leerCredencialId(formulario);
  if (!credencialId) return;
  await desvincularCredencial(credencialId, proyectoId);
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath("/credenciales");
}
