"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import { actualizarProyecto, crearProyecto, eliminarProyecto } from "@/lib/proyectos/operaciones";
import {
  validarEnlacesProyecto,
  validarProyecto,
  type ErroresEnlacesProyecto,
  type ErroresProyecto,
} from "@/lib/proyectos/validacion";
import { enModal } from "@/lib/formulario-modal";

export type EnlaceEscrito = { nombre: string; url: string };

export type EstadoFormulario = {
  errores?: ErroresProyecto;
  // Errores de las filas de enlaces, indexados por la posición de la fila enviada
  erroresEnlaces?: ErroresEnlacesProyecto;
  valores?: { nombre: string; descripcion: string; enlaces: EnlaceEscrito[] };
  // Guardado correcto en modo modal: el cliente cierra el modal en lugar de redirigir
  ok?: boolean;
};

const ERROR_NOMBRE_DUPLICADO = "Ya existe un proyecto con ese nombre.";

function leerCampos(formulario: FormData) {
  return {
    nombre: formulario.get("nombre"),
    descripcion: formulario.get("descripcion"),
  };
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

// Las filas de enlaces llegan como campos repetidos y se emparejan por posición
function leerEnlaces(formulario: FormData): EnlaceEscrito[] {
  const nombres = formulario.getAll("enlaceNombre").map(texto);
  const urls = formulario.getAll("enlaceUrl").map(texto);
  return nombres.map((nombre, i) => ({ nombre, url: urls[i] ?? "" }));
}

// Conserva lo escrito para que el formulario no se vacíe al fallar
function valoresEscritos(
  campos: ReturnType<typeof leerCampos>,
  enlaces: EnlaceEscrito[],
): EstadoFormulario["valores"] {
  return { nombre: texto(campos.nombre), descripcion: texto(campos.descripcion), enlaces };
}

// Valida datos y enlaces juntos para devolver todos los errores en un solo envío
function validarFormulario(formulario: FormData) {
  const campos = leerCampos(formulario);
  const filas = leerEnlaces(formulario);
  const proyecto = validarProyecto(campos);
  const enlaces = validarEnlacesProyecto(filas);
  if (proyecto.ok && enlaces.ok) {
    return { ok: true as const, datos: proyecto.datos, enlaces: enlaces.enlaces };
  }

  const errores: ErroresProyecto = proyecto.ok ? {} : proyecto.errores;
  if (!enlaces.ok && enlaces.general) errores.enlaces = enlaces.general;
  const estado: EstadoFormulario = {
    errores,
    erroresEnlaces: enlaces.ok ? undefined : enlaces.errores,
    valores: valoresEscritos(campos, filas),
  };
  return { ok: false as const, estado };
}

// Nombre repetido: se devuelve lo escrito para que el formulario no se vacíe
function errorDuplicado(formulario: FormData): EstadoFormulario {
  return {
    errores: { nombre: ERROR_NOMBRE_DUPLICADO },
    valores: valoresEscritos(leerCampos(formulario), leerEnlaces(formulario)),
  };
}

export async function accionCrearProyecto(
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();
  const validado = validarFormulario(formulario);
  if (!validado.ok) return validado.estado;

  const resultado = await crearProyecto(validado.datos, validado.enlaces);
  if (!resultado.ok) return errorDuplicado(formulario);

  revalidatePath("/proyectos");
  if (enModal(formulario)) return { ok: true };
  redirect(`/proyectos/${resultado.id}`);
}

export async function accionEditarProyecto(
  id: string,
  _anterior: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  await exigirSesion();
  const validado = validarFormulario(formulario);
  if (!validado.ok) return validado.estado;

  const resultado = await actualizarProyecto(id, validado.datos, validado.enlaces);
  if (!resultado) notFound();
  if (!resultado.ok) return errorDuplicado(formulario);

  revalidatePath("/proyectos", "layout");
  if (enModal(formulario)) return { ok: true };
  redirect(`/proyectos/${id}`);
}

export async function accionEliminarProyecto(id: string): Promise<void> {
  await exigirSesion();
  await eliminarProyecto(id);
  revalidatePath("/proyectos");
  redirect("/proyectos");
}
