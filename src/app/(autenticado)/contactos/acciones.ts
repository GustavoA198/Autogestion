"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  actualizarContacto,
  crearContacto,
  desvincularContacto,
  eliminarContacto,
  vincularContacto,
} from "@/lib/contactos/operaciones";
import { validarContacto, type ErroresContacto } from "@/lib/contactos/validacion";

export type ValoresContacto = {
  nombre: string;
  correo: string;
  telefono: string;
  empresaOCargo: string;
  nota: string;
  global: boolean;
  proyectoIds: string[];
};

export type EstadoFormularioContacto = {
  errores?: ErroresContacto;
  valores?: ValoresContacto;
};

const ERROR_PROYECTO = "Alguno de los proyectos elegidos ya no existe.";

function leerCampos(formulario: FormData) {
  return {
    nombre: formulario.get("nombre"),
    correo: formulario.get("correo"),
    telefono: formulario.get("telefono"),
    empresaOCargo: formulario.get("empresaOCargo"),
    nota: formulario.get("nota"),
    global: formulario.get("global") === "on",
    proyectoIds: formulario.getAll("proyectoIds"),
  };
}

function valoresEscritos(campos: ReturnType<typeof leerCampos>): ValoresContacto {
  const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");
  return {
    nombre: texto(campos.nombre),
    correo: texto(campos.correo),
    telefono: texto(campos.telefono),
    empresaOCargo: texto(campos.empresaOCargo),
    nota: texto(campos.nota),
    global: campos.global,
    proyectoIds: campos.proyectoIds.filter((id): id is string => typeof id === "string"),
  };
}

export async function accionCrearContacto(
  _anterior: EstadoFormularioContacto,
  formulario: FormData,
): Promise<EstadoFormularioContacto> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarContacto(campos);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await crearContacto(validado.datos);
  if (!resultado.ok) {
    return { errores: { proyectoIds: ERROR_PROYECTO }, valores: valoresEscritos(campos) };
  }

  revalidatePath("/contactos");
  redirect(`/contactos/${resultado.id}`);
}

export async function accionEditarContacto(
  id: string,
  _anterior: EstadoFormularioContacto,
  formulario: FormData,
): Promise<EstadoFormularioContacto> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarContacto(campos);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await actualizarContacto(id, validado.datos);
  if (!resultado) notFound();
  if (!resultado.ok) {
    return { errores: { proyectoIds: ERROR_PROYECTO }, valores: valoresEscritos(campos) };
  }

  revalidatePath("/contactos");
  revalidatePath("/proyectos", "layout");
  redirect(`/contactos/${id}`);
}

export async function accionEliminarContacto(id: string): Promise<void> {
  await exigirSesion();
  await eliminarContacto(id);
  revalidatePath("/contactos");
  revalidatePath("/proyectos", "layout");
  redirect("/contactos");
}

function leerContactoId(formulario: FormData): string | null {
  const valor = formulario.get("contactoId");
  return typeof valor === "string" && valor !== "" ? valor : null;
}

export async function accionVincularContacto(
  proyectoId: string,
  formulario: FormData,
): Promise<void> {
  await exigirSesion();
  const contactoId = leerContactoId(formulario);
  if (!contactoId) return;
  await vincularContacto(contactoId, proyectoId);
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath("/contactos");
}

export async function accionDesvincularContacto(
  proyectoId: string,
  formulario: FormData,
): Promise<void> {
  await exigirSesion();
  const contactoId = leerContactoId(formulario);
  if (!contactoId) return;
  await desvincularContacto(contactoId, proyectoId);
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath("/contactos");
}
