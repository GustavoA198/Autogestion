"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import {
  completarTarea,
  crearTarea,
  desconpletarTarea,
  actualizarTarea,
  eliminarTarea,
} from "@/lib/tareas/operaciones";
import { validarTarea, type ErroresTarea } from "@/lib/tareas/validacion";

export type ValoresTarea = {
  titulo: string;
  descripcion: string;
  tipoFrecuencia: string;
  diaSemana: string;
  diaMes: string;
  fechaPuntual: string;
  proyectoId: string;
};

export type EstadoFormularioTarea = {
  errores?: ErroresTarea;
  valores?: ValoresTarea;
};

function leerCampos(formulario: FormData) {
  return {
    titulo: formulario.get("titulo"),
    descripcion: formulario.get("descripcion"),
    tipoFrecuencia: formulario.get("tipoFrecuencia"),
    diaSemana: formulario.get("diaSemana"),
    diaMes: formulario.get("diaMes"),
    fechaPuntual: formulario.get("fechaPuntual"),
    proyectoId: formulario.get("proyectoId"),
  };
}

function valoresEscritos(campos: ReturnType<typeof leerCampos>): ValoresTarea {
  const texto = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    titulo: texto(campos.titulo),
    descripcion: texto(campos.descripcion),
    tipoFrecuencia: texto(campos.tipoFrecuencia),
    diaSemana: texto(campos.diaSemana),
    diaMes: texto(campos.diaMes),
    fechaPuntual: texto(campos.fechaPuntual),
    proyectoId: texto(campos.proyectoId),
  };
}

export async function accionCrearTarea(
  _anterior: EstadoFormularioTarea,
  formulario: FormData,
): Promise<EstadoFormularioTarea> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarTarea(campos);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  await crearTarea(validado.datos);
  revalidatePath("/tareas");
  revalidatePath("/proyectos", "layout");
  redirect(`/tareas`);
}

export async function accionEditarTarea(
  id: string,
  _anterior: EstadoFormularioTarea,
  formulario: FormData,
): Promise<EstadoFormularioTarea> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarTarea(campos);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await actualizarTarea(id, validado.datos);
  if (!resultado) notFound();

  revalidatePath("/tareas");
  revalidatePath("/proyectos", "layout");
  redirect("/tareas");
}

export async function accionEliminarTarea(id: string): Promise<void> {
  await exigirSesion();
  await eliminarTarea(id);
  revalidatePath("/tareas");
  revalidatePath("/proyectos", "layout");
  redirect("/tareas");
}

export async function accionCompletarTarea(id: string): Promise<{ ok: boolean }> {
  await exigirSesion();
  const ok = await completarTarea(id);
  revalidatePath("/tareas");
  return { ok };
}

export async function accionDesconpletarTarea(id: string): Promise<{ ok: boolean }> {
  await exigirSesion();
  const ok = await desconpletarTarea(id);
  revalidatePath("/tareas");
  return { ok };
}
