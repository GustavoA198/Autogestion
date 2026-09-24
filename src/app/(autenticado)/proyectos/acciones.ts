"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import { actualizarProyecto, crearProyecto, eliminarProyecto } from "@/lib/proyectos/operaciones";
import { validarProyecto, type ErroresProyecto } from "@/lib/proyectos/validacion";

export type EstadoFormulario = {
  errores?: ErroresProyecto;
  valores?: { nombre: string; descripcion: string; enlaceDocumentacion: string };
};

const ERROR_NOMBRE_DUPLICADO = "Ya existe un proyecto con ese nombre.";

function leerCampos(formulario: FormData) {
  return {
    nombre: formulario.get("nombre"),
    descripcion: formulario.get("descripcion"),
    enlaceDocumentacion: formulario.get("enlaceDocumentacion"),
  };
}

// Conserva lo escrito para que el formulario no se vacíe al fallar
function valoresEscritos(campos: ReturnType<typeof leerCampos>): EstadoFormulario["valores"] {
  const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");
  return {
    nombre: texto(campos.nombre),
    descripcion: texto(campos.descripcion),
    enlaceDocumentacion: texto(campos.enlaceDocumentacion),
  };
}

export async function accionCrearProyecto(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarProyecto(campos);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await crearProyecto(validado.datos);
  if (!resultado.ok) {
    return { errores: { nombre: ERROR_NOMBRE_DUPLICADO }, valores: valoresEscritos(campos) };
  }

  revalidatePath("/proyectos");
  redirect(`/proyectos/${resultado.id}`);
}

export async function accionEditarProyecto(
  id: string,
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarProyecto(campos);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await actualizarProyecto(id, validado.datos);
  if (!resultado) notFound();
  if (!resultado.ok) {
    return { errores: { nombre: ERROR_NOMBRE_DUPLICADO }, valores: valoresEscritos(campos) };
  }

  revalidatePath("/proyectos");
  redirect(`/proyectos/${id}`);
}

export async function accionEliminarProyecto(id: string): Promise<void> {
  await exigirSesion();
  await eliminarProyecto(id);
  revalidatePath("/proyectos");
  redirect("/proyectos");
}
