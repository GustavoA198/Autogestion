import type { TareaCompletada } from "@/generated/prisma/client";
import type { ProyectoModel } from "@/generated/prisma/models/Proyecto";

// Resultado tipado de findMany con include de tarea.proyectoId
export type TareaCompletadaConTarea = TareaCompletada & {
  tarea: { proyectoId: string | null };
};

// Inicio de semana (lunes) en la zona horaria indicada
export function fechaInicioSemana(fecha: Date, zona: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const partes = formatter.formatToParts(fecha);
  const get = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 1);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const diaSemana = partes.find((p) => p.type === "weekday")?.value ?? "";
  const numSemana =
    diaSemana === "Sun"
      ? 0
      : diaSemana === "Mon"
        ? 1
        : diaSemana === "Tue"
          ? 2
          : diaSemana === "Wed"
            ? 3
            : diaSemana === "Thu"
              ? 4
              : diaSemana === "Fri"
                ? 5
                : 6;
  const diff = numSemana === 0 ? -6 : 1 - numSemana;
  // Usar UTC para que el calculo no dependa de la zona local
  const result = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

// Agrupar completadas por semana ISO (lunes-domingo)
export function agruparPorSemana(
  completadas: TareaCompletadaConTarea[],
  zona: string,
): { semana: string; cantidad: number }[] {
  const mapa = new Map<string, number>();
  for (const c of completadas) {
    const fecha = new Date(c.fecha);
    const inicio = fechaInicioSemana(fecha, zona);
    const clave = inicio.toISOString().slice(0, 10);
    mapa.set(clave, (mapa.get(clave) ?? 0) + 1);
  }
  return Array.from(mapa.entries())
    .map(([semana, cantidad]) => ({ semana, cantidad }))
    .sort((a, b) => a.semana.localeCompare(b.semana));
}

// Agrupar completadas por proyecto
export function agruparPorProyecto(
  completadas: TareaCompletadaConTarea[],
  proyectos: Pick<ProyectoModel, "id" | "nombre">[],
): { proyectoId: string | null; nombre: string; cantidad: number }[] {
  const mapa = new Map<string | null, number>();
  for (const c of completadas) {
    const key = c.tarea?.proyectoId ?? null;
    mapa.set(key, (mapa.get(key) ?? 0) + 1);
  }
  return proyectos
    .map((p) => ({
      proyectoId: p.id,
      nombre: p.nombre,
      cantidad: mapa.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}
