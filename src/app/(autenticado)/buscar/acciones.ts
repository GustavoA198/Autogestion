"use server";

import { z } from "zod";
import { exigirSesion } from "@/lib/auth/sesion";
import { buscarGlobal } from "@/lib/busqueda/operaciones";
import type { ResultadoGlobal } from "@/lib/busqueda/operaciones";

const esquemaBusqueda = z.string().min(2, "Mínimo 2 caracteres.").max(100).trim();

export type ResultadoBusqueda =
  { ok: true; termino: string; resultados: ResultadoGlobal } | { ok: false; error: string };

export async function accionBuscar(termino: string): Promise<ResultadoBusqueda> {
  await exigirSesion();

  const validado = esquemaBusqueda.safeParse(termino);
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message ?? "Término no válido." };
  }

  const resultados = await buscarGlobal(validado.data);
  return { ok: true, termino: validado.data, resultados };
}
