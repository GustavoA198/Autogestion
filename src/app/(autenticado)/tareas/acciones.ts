"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import type { EstadoTarea } from "@/generated/prisma/enums";
import {
  actualizarTarea,
  agregarComentario,
  agregarEnlace,
  agregarSubtarea,
  alternarSubtarea,
  asignarFechaPendiente,
  cambiarEstadoTarea,
  completarTareaConEstado,
  crearTarea,
  editarSubtarea,
  eliminarComentario,
  eliminarEnlace,
  eliminarSubtarea,
  eliminarTarea,
  moverSubtarea,
  reabrirTarea,
  TAREA_CERRADA,
} from "@/lib/tareas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { fechaDeTexto } from "@/lib/tareas/pendientes";
import {
  VALORES_ESTADO,
  validarComentario,
  validarDescripcionSubtarea,
  validarEnlace,
  validarSubtarea,
  validarTarea,
  type DatosEnlace,
  type ErroresTarea,
} from "@/lib/tareas/validacion";

export type EnlaceEscrito = { etiqueta: string; url: string };

export type ValoresTarea = {
  titulo: string;
  descripcion: string;
  tipoFrecuencia: string;
  diaSemana: string;
  diaMes: string;
  fechaPuntual: string;
  proyectoId: string;
  estado: string;
  prioridad: string;
  fechaInicio: string;
  fechaLimite: string;
  responsable: string;
  asignadoPor: string;
  // Solo en la creación: enlaces y subtareas iniciales
  enlaces?: EnlaceEscrito[];
  subtareas?: { texto: string; descripcion: string }[];
};

// Errores de las filas dinámicas, indexados por la posición de la fila enviada
export type ErroresListasTarea = {
  enlaces?: Record<number, { etiqueta?: string; url?: string }>;
  subtareas?: Record<number, string>;
};

export type EstadoFormularioTarea = {
  errores?: ErroresTarea;
  erroresListas?: ErroresListasTarea;
  valores?: ValoresTarea;
  // Guardado correcto en modo modal: el cliente cierra el modal en lugar de redirigir
  ok?: boolean;
};

// Refresca las vistas que muestran tareas: listado, detalle, dashboard, calendario y proyectos
function revalidarTareas(): void {
  revalidatePath("/tareas", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath("/proyectos", "layout");
}

// Los campos escalares se envían siempre: un vacío limpia el dato y un campo ausente no lo toca
function leerCampos(formulario: FormData) {
  return {
    titulo: formulario.get("titulo"),
    descripcion: formulario.get("descripcion"),
    tipoFrecuencia: formulario.get("tipoFrecuencia"),
    diaSemana: formulario.get("diaSemana"),
    diaMes: formulario.get("diaMes"),
    fechaPuntual: formulario.get("fechaPuntual"),
    proyectoId: formulario.get("proyectoId"),
    estado: formulario.get("estado") ?? undefined,
    prioridad: formulario.get("prioridad") ?? undefined,
    fechaInicio: formulario.get("fechaInicio") ?? undefined,
    fechaLimite: formulario.get("fechaLimite") ?? undefined,
    responsable: formulario.get("responsable") ?? undefined,
    asignadoPor: formulario.get("asignadoPor") ?? undefined,
  };
}

// El formulario montado en un modal de ruta avisa con un campo oculto modal=1
function enModal(formulario: FormData): boolean {
  return formulario.get("modal") === "1";
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function leerListas(formulario: FormData) {
  const etiquetas = formulario.getAll("enlaceEtiqueta").map(texto);
  const urls = formulario.getAll("enlaceUrl").map(texto);
  const enlaces: EnlaceEscrito[] = etiquetas.map((etiqueta, i) => ({
    etiqueta,
    url: urls[i] ?? "",
  }));
  const textos = formulario.getAll("subtarea").map(texto);
  const descripciones = formulario.getAll("subtareaDescripcion").map(texto);
  const subtareas = textos.map((texto, i) => ({
    texto,
    descripcion: descripciones[i] ?? "",
  }));
  return { enlaces, subtareas };
}

function valoresEscritos(
  campos: ReturnType<typeof leerCampos>,
  listas?: ReturnType<typeof leerListas>,
): ValoresTarea {
  return {
    titulo: texto(campos.titulo),
    descripcion: texto(campos.descripcion),
    tipoFrecuencia: texto(campos.tipoFrecuencia),
    diaSemana: texto(campos.diaSemana),
    diaMes: texto(campos.diaMes),
    fechaPuntual: texto(campos.fechaPuntual),
    proyectoId: texto(campos.proyectoId),
    estado: texto(campos.estado),
    prioridad: texto(campos.prioridad),
    fechaInicio: texto(campos.fechaInicio),
    fechaLimite: texto(campos.fechaLimite),
    responsable: texto(campos.responsable),
    asignadoPor: texto(campos.asignadoPor),
    ...(listas ? { enlaces: listas.enlaces, subtareas: listas.subtareas } : {}),
  };
}

// Valida las filas dinámicas; las filas completamente vacías se descartan sin error
function validarListas(listas: ReturnType<typeof leerListas>) {
  const erroresListas: ErroresListasTarea = {};
  const enlaces: DatosEnlace[] = [];
  const subtareas: { texto: string; descripcion: string | null }[] = [];

  listas.enlaces.forEach((fila, indice) => {
    if (fila.etiqueta.trim() === "" && fila.url.trim() === "") return;
    const validado = validarEnlace(fila);
    if (validado.ok) enlaces.push(validado.datos);
    else (erroresListas.enlaces ??= {})[indice] = validado.errores;
  });

  listas.subtareas.forEach((fila, indice) => {
    if (fila.texto.trim() === "") return;
    const validado = validarSubtarea(fila.texto);
    if (validado.ok) {
      subtareas.push({ texto: validado.texto, descripcion: validarDescripcionSubtarea(fila.descripcion) });
    } else (erroresListas.subtareas ??= {})[indice] = validado.error;
  });

  const hayErrores = Boolean(erroresListas.enlaces || erroresListas.subtareas);
  return { enlaces, subtareas, erroresListas, hayErrores };
}

const MENSAJE_PROYECTO_INEXISTENTE = "El proyecto elegido ya no existe.";

// Un proyecto elegido que ya no existe se informa como error de campo en vez de fallar al guardar
async function proyectoInexistente(proyectoId: string | null): Promise<boolean> {
  return proyectoId !== null && (await obtenerProyecto(proyectoId)) === null;
}

export async function accionCrearTarea(
  _anterior: EstadoFormularioTarea,
  formulario: FormData,
): Promise<EstadoFormularioTarea> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const listas = leerListas(formulario);
  const validado = validarTarea(campos);
  const validadoListas = validarListas(listas);
  if (!validado.ok || validadoListas.hayErrores) {
    return {
      errores: validado.ok ? undefined : validado.errores,
      erroresListas: validadoListas.hayErrores ? validadoListas.erroresListas : undefined,
      valores: valoresEscritos(campos, listas),
    };
  }

  if (await proyectoInexistente(validado.datos.proyectoId)) {
    return {
      errores: { proyectoId: MENSAJE_PROYECTO_INEXISTENTE },
      valores: valoresEscritos(campos, listas),
    };
  }

  const creada = await crearTarea(validado.datos);
  // Secuencial: el orden de cada enlace y subtarea depende del anterior; creada ya completada, nacen hechas
  const nacenHechas = validado.datos.estado === "COMPLETADA";
  for (const enlace of validadoListas.enlaces) await agregarEnlace(creada.id, enlace);
  for (const subtarea of validadoListas.subtareas) {
    await agregarSubtarea(creada.id, subtarea.texto, {
      permitirCerrada: true,
      hecha: nacenHechas,
      descripcion: subtarea.descripcion,
    });
  }
  revalidarTareas();
  if (enModal(formulario)) return { ok: true };
  // Solo se vuelve a destinos de la lista blanca; cualquier otro valor cae en /tareas
  redirect(formulario.get("volver") === "calendario" ? "/calendario" : "/tareas");
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
  if (await proyectoInexistente(validado.datos.proyectoId)) {
    return {
      errores: { proyectoId: MENSAJE_PROYECTO_INEXISTENTE },
      valores: valoresEscritos(campos),
    };
  }

  const resultado = await actualizarTarea(id, validado.datos);
  if (!resultado) notFound();

  revalidarTareas();
  if (enModal(formulario)) return { ok: true };
  redirect("/tareas");
}

export async function accionEliminarTarea(id: string): Promise<void> {
  await exigirSesion();
  await eliminarTarea(id);
  revalidarTareas();
  redirect("/tareas");
}

export type ResultadoAccionTarea = { ok: boolean; error?: string };

// Elimina desde listas sin redirigir: la vista actual se refresca en el sitio y conserva el scroll
export async function accionEliminarTareaEnLista(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const ok = await eliminarTarea(id);
  revalidarTareas();
  return ok ? { ok } : { ok, error: "La tarea ya no existe." };
}

const MENSAJE_TAREA_CERRADA = "Reabre la tarea para cambiar sus subtareas.";

// Completa desde listas: en puntuales además cierra la tarea; en recurrentes solo marca el día
export async function accionCompletarTarea(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const ok = await completarTareaConEstado(id);
  revalidarTareas();
  return ok ? { ok } : { ok, error: "No se pudo completar la tarea." };
}

// Deshace la marca de hoy; en puntuales además reabre la tarea
export async function accionDesconpletarTarea(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const ok = await reabrirTarea(id);
  revalidarTareas();
  return ok ? { ok } : { ok, error: "No se pudo reabrir la tarea." };
}

// Programa un pendiente: valida el día (AAAA-MM-DD), exige sesión y lo mueve al calendario
export async function accionAsignarFecha(id: string, fecha: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const dia = fechaDeTexto(fecha);
  if (!dia) return { ok: false, error: "Elige una fecha válida." };

  const asignada = await asignarFechaPendiente(id, dia);
  if (!asignada) return { ok: false, error: "La tarea ya no está pendiente de fecha." };
  revalidarTareas();
  return { ok: true };
}

export async function accionCambiarEstadoTarea(
  id: string,
  estado: string,
): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  if (!VALORES_ESTADO.includes(estado)) return { ok: false, error: "Elige un estado válido." };

  const resultado = await cambiarEstadoTarea(id, estado as EstadoTarea);
  if (!resultado) return { ok: false, error: "La tarea no existe." };
  revalidarTareas();
  return { ok: true };
}

// Resultado común de las acciones de subtareas: inexistente, tarea cerrada o cambio aplicado
function resultadoSubtarea(resultado: unknown): ResultadoAccionTarea {
  if (resultado === null || resultado === false)
    return { ok: false, error: "La subtarea no existe." };
  if (resultado === TAREA_CERRADA) return { ok: false, error: MENSAJE_TAREA_CERRADA };
  revalidarTareas();
  return { ok: true };
}

export async function accionAgregarSubtarea(
  tareaId: string,
  texto: string,
  descripcion?: string,
): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const validado = validarSubtarea(texto);
  if (!validado.ok) return { ok: false, error: validado.error };
  const descripcionNormalizada = validarDescripcionSubtarea(descripcion);

  const subtarea = await agregarSubtarea(tareaId, validado.texto, {
    descripcion: descripcionNormalizada,
  });
  if (!subtarea) return { ok: false, error: "La tarea no existe." };
  if (subtarea === TAREA_CERRADA) return { ok: false, error: MENSAJE_TAREA_CERRADA };
  revalidarTareas();
  return { ok: true };
}

export async function accionEditarSubtarea(
  id: string,
  texto: string,
  descripcion?: string,
): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const validado = validarSubtarea(texto);
  if (!validado.ok) return { ok: false, error: validado.error };
  const descripcionNormalizada = validarDescripcionSubtarea(descripcion);
  return resultadoSubtarea(await editarSubtarea(id, validado.texto, descripcionNormalizada));
}

export async function accionAlternarSubtarea(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  return resultadoSubtarea(await alternarSubtarea(id));
}

export async function accionEliminarSubtarea(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  return resultadoSubtarea(await eliminarSubtarea(id));
}

export async function accionMoverSubtarea(
  id: string,
  sentido: "arriba" | "abajo",
): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  if (sentido !== "arriba" && sentido !== "abajo")
    return { ok: false, error: "Movimiento no válido." };
  return resultadoSubtarea(await moverSubtarea(id, sentido));
}

export async function accionAgregarEnlace(
  tareaId: string,
  etiqueta: string,
  url: string,
): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const validado = validarEnlace({ etiqueta, url });
  if (!validado.ok) {
    const { etiqueta: errorEtiqueta, url: errorUrl } = validado.errores;
    return { ok: false, error: errorEtiqueta ?? errorUrl };
  }

  const enlace = await agregarEnlace(tareaId, validado.datos);
  if (!enlace) return { ok: false, error: "La tarea no existe." };
  revalidarTareas();
  return { ok: true };
}

export async function accionEliminarEnlace(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const ok = await eliminarEnlace(id);
  revalidarTareas();
  return ok ? { ok } : { ok, error: "El enlace no existe." };
}

export async function accionAgregarComentario(
  tareaId: string,
  texto: string,
): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const validado = validarComentario(texto);
  if (!validado.ok) return { ok: false, error: validado.error };

  const comentario = await agregarComentario(tareaId, validado.texto);
  if (!comentario) return { ok: false, error: "La tarea no existe." };
  revalidarTareas();
  return { ok: true };
}

export async function accionEliminarComentario(id: string): Promise<ResultadoAccionTarea> {
  await exigirSesion();
  const ok = await eliminarComentario(id);
  revalidarTareas();
  return ok ? { ok } : { ok, error: "El comentario no existe." };
}
