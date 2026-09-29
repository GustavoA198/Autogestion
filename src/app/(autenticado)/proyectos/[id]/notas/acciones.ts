"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import { actualizarNota, crearNota, eliminarNota } from "@/lib/notas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";
import { validarNota, type ErroresNota } from "@/lib/notas/validacion";
import { enModal } from "@/lib/formulario-modal";

export type ValoresFormularioNota = {
  texto: string;
  fecha: string;
  proximoPaso: string;
  minutos: string;
};

export type EstadoFormularioNota = {
  errores?: ErroresNota;
  valores?: ValoresFormularioNota;
  // Guardado correcto en modo modal: el cliente cierra el modal en lugar de redirigir
  ok?: boolean;
};

function leerTexto(formulario: FormData, campo: string): string {
  const valor = formulario.get(campo);
  return typeof valor === "string" ? valor : "";
}

function leerCampos(formulario: FormData) {
  return {
    texto: leerTexto(formulario, "texto"),
    fecha: leerTexto(formulario, "fecha"),
    proximoPaso: leerTexto(formulario, "proximoPaso"),
    minutos: leerTexto(formulario, "minutos"),
    proyectoId: leerTexto(formulario, "proyectoId"),
  };
}

function valoresEscritos(campos: ValoresFormularioNota): ValoresFormularioNota {
  return {
    texto: campos.texto,
    fecha: campos.fecha,
    proximoPaso: campos.proximoPaso,
    minutos: campos.minutos,
  };
}

// Las vistas que muestran la bitácora se refrescan tras cualquier cambio
function revalidarBitacora(proyectoId: string) {
  revalidatePath(`/proyectos/${proyectoId}`, "layout");
  revalidatePath("/notas");
  revalidatePath("/dashboard");
}

export async function accionCrearNota(
  _anterior: EstadoFormularioNota,
  formulario: FormData,
): Promise<EstadoFormularioNota> {
  await exigirSesion();
  const campos = leerCampos(formulario);
  const validado = validarNota(campos, campos.fecha);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };
  if (!(await obtenerProyecto(validado.datos.proyectoId))) {
    return {
      errores: { proyectoId: "El proyecto elegido ya no existe." },
      valores: valoresEscritos(campos),
    };
  }

  await crearNota(validado.datos);
  revalidarBitacora(validado.datos.proyectoId);
  if (enModal(formulario)) return { ok: true };
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
  const validado = validarNota({ ...campos, proyectoId }, campos.fecha);
  if (!validado.ok) return { errores: validado.errores, valores: valoresEscritos(campos) };

  const resultado = await actualizarNota(id, {
    fecha: validado.datos.fecha,
    texto: validado.datos.texto,
    proximoPaso: validado.datos.proximoPaso,
    minutos: validado.datos.minutos,
  });
  if (!resultado) notFound();

  revalidarBitacora(proyectoId);
  if (enModal(formulario)) return { ok: true };
  redirect(`/proyectos/${proyectoId}?seccion=notas`);
}

export async function accionEliminarNota(id: string, proyectoId: string): Promise<void> {
  await exigirSesion();
  await eliminarNota(id);
  revalidarBitacora(proyectoId);
  redirect(`/proyectos/${proyectoId}?seccion=notas`);
}
