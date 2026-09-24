"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirSesion } from "@/lib/auth/sesion";
import { clonarTareas } from "@/lib/tareas/operaciones";
import { obtenerProyecto } from "@/lib/proyectos/operaciones";

export async function accionClonarTareas(
  origenId: string,
  destinoId: string,
  tareaIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  await exigirSesion();

  // Valida que destino exista y sea distinto del origen
  if (origenId === destinoId) {
    return { ok: false, error: "El proyecto destino no puede ser el mismo que el origen." };
  }

  const destino = await obtenerProyecto(destinoId);
  if (!destino) {
    return { ok: false, error: "El proyecto destino no existe." };
  }

  const resultado = await clonarTareas(origenId, destinoId, tareaIds);

  if (resultado.cantidad === 0) {
    return { ok: false, error: "No se pudieron clonar las tareas seleccionadas." };
  }

  revalidatePath(`/proyectos/${origenId}`);
  revalidatePath(`/proyectos/${destinoId}`);
  redirect(`/proyectos/${destinoId}`);
}
