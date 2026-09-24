"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import { actualizarNota, crearNota, eliminarNota } from "@/lib/notas/operaciones";
import { validarNota, type ErroresNota } from "@/lib/notas/validacion";

export type EstadoFormularioNota = {
  errores?: ErroresNota;
  valores?: { texto: string; fecha: string };
};

function leerCampos(formulario: FormData) {
  const texto = formulario.get("texto");
  const fecha = formulario.get("fecha");
  const proyectoId = formulario.get("proyectoId");
  return {
    texto: typeof texto === "string" ? texto : "",
    fecha: typeof fecha === "string" ? fecha : "",
    proyectoId: typeof proyectoId === "string" ? proyectoId : "",
  };
}

function valoresEscritos(campos: {
  texto: string;
  fecha: string;
}): EstadoFormularioNota["valores"] {
  return { texto: campos.texto, fecha: campos.fecha };
}

export async function accionCrearNota(
  _anterior: EstadoFormularioNota,
  formulario: FormData,
): Promise<EstadoFormularioNota> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarNota(
    { texto: campos.texto, proyectoId: campos.proyectoId },
    campos.fecha,
  );
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  await crearNota(validado.datos);
  revalidatePath(`/proyectos/${validado.datos.proyectoId}`);
  redirect(`/proyectos/${validado.datos.proyectoId}?seccion=notas`);
}

export async function accionEditarNota(
  id: string,
  proyectoId: string,
  _anterior: EstadoFormularioNota,
  formulario: FormData,
): Promise<EstadoFormularioNota> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarNota({ texto: campos.texto, proyectoId }, campos.fecha);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await actualizarNota(id, {
    fecha: validado.datos.fecha,
    texto: validado.datos.texto,
  });
  if (!resultado) notFound();

  revalidatePath(`/proyectos/${proyectoId}`);
  redirect(`/proyectos/${proyectoId}?seccion=notas`);
}

export async function accionEliminarNota(id: string, proyectoId: string): Promise<void> {
  await exigirSesion();
  await eliminarNota(id);
  revalidatePath(`/proyectos/${proyectoId}`);
  redirect(`/proyectos/${proyectoId}?seccion=notas`);
}
